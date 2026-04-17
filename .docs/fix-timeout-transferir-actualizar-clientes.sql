-- Fix: "canceling statement due to statement timeout" en /clientes → "Actualizar con Pipedrive".
-- Basado en esquema real:
--   pip_persons.email / pip_persons.telefono son JSONB (no strings, no se indexan directo para esta búsqueda)
--   clientes.email (text) / clientes.telefono (varchar) → sí se pueden indexar con LOWER(TRIM(...))
-- Ejecutar una vez en Supabase → SQL Editor.

-- =====================================================================
-- 1) Índices funcionales para el dedupe por email y teléfono en clientes
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_clientes_email_lower_trim
    ON public.clientes (LOWER(TRIM(email)))
    WHERE email IS NOT NULL AND email <> '';

CREATE INDEX IF NOT EXISTS idx_clientes_telefono_lower_trim
    ON public.clientes (LOWER(TRIM(telefono)))
    WHERE telefono IS NOT NULL AND telefono <> '';

-- =====================================================================
-- 2) Reescribir la función reemplazando NOT IN por NOT EXISTS y subir timeout a 300s
--    (NOT IN con subquery de 212k ids es más lento que antijoin NOT EXISTS)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.transferir_nuevos_pip_a_clientes()
    RETURNS TABLE(insertados integer, skipeados_dup integer)
    LANGUAGE plpgsql
    SET statement_timeout TO '300s'
AS $function$
DECLARE
  v_insertados integer;
  v_skipeados integer;
  v_total_nuevos integer;
BEGIN
  CREATE TEMP TABLE _tmp_candidatos ON COMMIT DROP AS
  WITH emails_existentes AS (
    SELECT DISTINCT LOWER(TRIM(email)) AS e
    FROM clientes WHERE email IS NOT NULL AND email <> ''
  ),
  telefonos_existentes AS (
    SELECT DISTINCT LOWER(TRIM(telefono)) AS t
    FROM clientes WHERE telefono IS NOT NULL AND telefono <> ''
  ),
  nuevos AS (
    SELECT p.*,
           (SELECT e->>'value' FROM jsonb_array_elements(p.email) e
            WHERE (e->>'primary')::bool AND e->>'value' <> '' LIMIT 1) AS email_primary,
           (SELECT t->>'value' FROM jsonb_array_elements(p.telefono) t
            WHERE (t->>'primary')::bool AND t->>'value' <> '' LIMIT 1) AS tel_primary
    FROM pip_persons p
    WHERE p.pipedrive_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM clientes c
        WHERE c.pipedrive_id = p.pipedrive_id
      )
  ),
  filtrados AS (
    SELECT n.*,
           LOWER(TRIM(n.email_primary)) AS email_norm,
           LOWER(TRIM(n.tel_primary))   AS tel_norm
    FROM nuevos n
  )
  SELECT f.*,
         CASE
           WHEN (f.email_norm IS NULL OR f.email_norm = '' OR NOT EXISTS (SELECT 1 FROM emails_existentes WHERE e = f.email_norm))
            AND (f.tel_norm IS NULL OR f.tel_norm = '' OR NOT EXISTS (SELECT 1 FROM telefonos_existentes WHERE t = f.tel_norm))
           THEN true ELSE false
         END AS es_candidato
  FROM filtrados f;

  SELECT COUNT(*) INTO v_total_nuevos FROM _tmp_candidatos;

  WITH ins AS (
    INSERT INTO clientes (
      tipo, nombre, apellidos, puesto, email, telefono,
      direccion, fuente, fechacreacion, fechamodificacion, activo, notas,
      pipedrive_id, pipedrive_organizacionid, pipedrive_organizacion_nombre,
      pipedrive_usuarioid, pipedrive_correos, pipedrive_telefonos,
      pipedrive_pais, pipedrive_estado, pipedrive_ciudad, pipedrive_codigopostal,
      pipedrive_direccion, pipedrive_tipo_contacto,
      pipedrive_potencial_mensual_cn, pipedrive_afiliado_fidelizacion,
      whatsapp_chat_link, cumpleanos, division_filial_area, tipo_reservas
    )
    SELECT
      CASE WHEN c.organizacion_id IS NOT NULL THEN 'Empresa' ELSE 'Individual' END,
      c.primer_nombre, c.apellidos, c.puesto,
      NULLIF(c.email_norm,''),
      NULLIF(LEFT(c.tel_primary,20),''),
      c.direccion_completa, 'Pipedrive',
      COALESCE(c.pipedrive_add_time, now()),
      COALESCE(c.pipedrive_update_time, now()),
      COALESCE(c.activo, true), c.notas,
      c.pipedrive_id, c.organizacion_id, c.organizacion_nombre,
      c.propietario_id, c.email::json, c.telefono::json,
      c.direccion_pais, c.direccion_estado, c.direccion_ciudad, c.direccion_codigo_postal,
      c.direccion_completa, c.tipo_contacto,
      c.potencial_mensual_cn, c.afiliado_fidelizacion,
      c.whatsapp_chat_link, c.cumpleanos, c.division_filial_area, c.tipo_reservas
    FROM _tmp_candidatos c
    WHERE c.es_candidato
    RETURNING 1
  )
  SELECT COUNT(*)::int INTO v_insertados FROM ins;

  v_skipeados := v_total_nuevos - v_insertados;
  DROP TABLE _tmp_candidatos;
  RETURN QUERY SELECT v_insertados, v_skipeados;
END;
$function$;

-- =====================================================================
-- 3) También subir timeout de la otra función usada por el botón
--    "Actualizar clientes desde tabla especial"
-- =====================================================================
ALTER FUNCTION public.actualizar_clientes_desde_pip_persons()
    SET statement_timeout = '300s';

-- =====================================================================
-- 4) Refrescar estadísticas para que el planner use los nuevos índices
-- =====================================================================
ANALYZE public.clientes;
ANALYZE public.pip_persons;

-- =====================================================================
-- 5) Verificación
-- =====================================================================
SELECT proname, proconfig
FROM pg_proc
WHERE proname IN ('transferir_nuevos_pip_a_clientes', 'actualizar_clientes_desde_pip_persons');

SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('idx_clientes_email_lower_trim', 'idx_clientes_telefono_lower_trim');
