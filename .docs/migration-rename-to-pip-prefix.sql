-- =====================================================
-- Migración: renombrar tablas persons y organizations
-- para agregar prefijo "pip_" y mantener consistencia
-- con pip_activities, pip_tasks, pip_notes, pip_users.
-- Fecha: 2026-04-13
-- =====================================================

-- 1) Renombrar tablas
ALTER TABLE IF EXISTS persons RENAME TO pip_persons;
ALTER TABLE IF EXISTS organizations RENAME TO pip_organizations;

-- 2) Renombrar la secuencia del SERIAL (opcional pero recomendado)
ALTER SEQUENCE IF EXISTS persons_id_seq RENAME TO pip_persons_id_seq;
ALTER SEQUENCE IF EXISTS organizations_id_seq RENAME TO pip_organizations_id_seq;

-- 3) Renombrar índices (opcional, solo por consistencia de nombres)
ALTER INDEX IF EXISTS idx_persons_pipedrive_id       RENAME TO idx_pip_persons_pipedrive_id;
ALTER INDEX IF EXISTS idx_persons_nombre             RENAME TO idx_pip_persons_nombre;
ALTER INDEX IF EXISTS idx_persons_organizacion_id    RENAME TO idx_pip_persons_organizacion_id;
ALTER INDEX IF EXISTS idx_persons_propietario_id     RENAME TO idx_pip_persons_propietario_id;
ALTER INDEX IF EXISTS idx_persons_activo             RENAME TO idx_pip_persons_activo;

ALTER INDEX IF EXISTS idx_organizations_pipedrive_id   RENAME TO idx_pip_organizations_pipedrive_id;
ALTER INDEX IF EXISTS idx_organizations_nombre         RENAME TO idx_pip_organizations_nombre;
ALTER INDEX IF EXISTS idx_organizations_propietario_id RENAME TO idx_pip_organizations_propietario_id;
ALTER INDEX IF EXISTS idx_organizations_activo         RENAME TO idx_pip_organizations_activo;

-- 4) Comentarios de tabla
COMMENT ON TABLE pip_persons       IS 'Tabla de personas/contactos sincronizada con Pipedrive Persons API';
COMMENT ON TABLE pip_organizations IS 'Tabla de organizaciones sincronizada con Pipedrive Organizations API';
