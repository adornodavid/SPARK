-- =====================================================
-- Tabla: organizations
-- Basada en la estructura del endpoint Organizations de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-09
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  -- Identificador interno SPARK
  id SERIAL PRIMARY KEY,

  -- Identificador Pipedrive
  pipedrive_id INTEGER UNIQUE,

  -- Datos básicos
  nombre VARCHAR(255),
  primer_caracter VARCHAR(5),

  -- Propietario (usuario de Pipedrive)
  propietario_id INTEGER,
  propietario_nombre VARCHAR(255),

  -- Dirección
  direccion TEXT,
  direccion_subpremise VARCHAR(100),
  direccion_numero_casa VARCHAR(50),
  direccion_calle VARCHAR(255),
  direccion_sublocalidad VARCHAR(255),
  direccion_ciudad VARCHAR(255),
  direccion_estado VARCHAR(255),
  direccion_region VARCHAR(255),
  direccion_pais VARCHAR(255),
  direccion_codigo_postal VARCHAR(20),
  direccion_completa TEXT,

  -- Contacto
  cc_email VARCHAR(255),

  -- Estadísticas (readonly desde Pipedrive)
  personas_count INTEGER DEFAULT 0,
  tratos_abiertos INTEGER DEFAULT 0,
  tratos_abiertos_relacionados INTEGER DEFAULT 0,
  tratos_cerrados INTEGER DEFAULT 0,
  tratos_cerrados_relacionados INTEGER DEFAULT 0,
  tratos_ganados INTEGER DEFAULT 0,
  tratos_ganados_relacionados INTEGER DEFAULT 0,
  tratos_perdidos INTEGER DEFAULT 0,
  tratos_perdidos_relacionados INTEGER DEFAULT 0,
  actividades_total INTEGER DEFAULT 0,
  actividades_completadas INTEGER DEFAULT 0,
  actividades_pendientes INTEGER DEFAULT 0,
  emails_count INTEGER DEFAULT 0,
  archivos_count INTEGER DEFAULT 0,
  notas_count INTEGER DEFAULT 0,
  seguidores_count INTEGER DEFAULT 0,

  -- Etiquetas
  etiqueta INTEGER,
  etiqueta_ids JSONB DEFAULT '[]'::jsonb,

  -- Visibilidad
  visible_para INTEGER,

  -- Fechas de actividad
  fecha_proxima_actividad DATE,
  fecha_ultima_actividad DATE,
  proxima_actividad_id INTEGER,
  ultima_actividad_id INTEGER,

  -- Estado
  activo BOOLEAN DEFAULT true,

  -- Campos personalizados
  campos_custom JSONB DEFAULT '{}'::jsonb,

  -- Fechas de control
  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  pipedrive_delete_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW(),

  -- Company ID de Pipedrive
  pipedrive_company_id INTEGER
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_organizations_pipedrive_id ON organizations(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_organizations_nombre ON organizations(nombre);
CREATE INDEX IF NOT EXISTS idx_organizations_propietario_id ON organizations(propietario_id);
CREATE INDEX IF NOT EXISTS idx_organizations_activo ON organizations(activo);

-- Comentario de tabla
COMMENT ON TABLE organizations IS 'Tabla de organizaciones sincronizada con Pipedrive Organizations API';
