-- =====================================================
-- Tabla: pip_activities
-- Basada en la estructura del endpoint Activities de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-09
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_activities (
  -- Identificador interno SPARK
  id SERIAL PRIMARY KEY,

  -- Identificador Pipedrive
  pipedrive_id INTEGER UNIQUE,

  -- Datos básicos
  asunto VARCHAR(500),
  tipo VARCHAR(100),
  nota TEXT,
  descripcion_publica TEXT,
  prioridad INTEGER,

  -- Relaciones
  trato_id INTEGER,
  lead_id VARCHAR(255),
  persona_id INTEGER,
  organizacion_id INTEGER,
  proyecto_id INTEGER,

  -- Propietario y creador
  propietario_id INTEGER,
  creador_id INTEGER,

  -- Fechas y duración
  fecha_vencimiento DATE,
  hora_vencimiento VARCHAR(10),
  duracion VARCHAR(10),
  completado BOOLEAN DEFAULT false,
  fecha_completado TIMESTAMP,

  -- Ubicación
  ubicacion TEXT,
  ubicacion_pais VARCHAR(255),
  ubicacion_estado VARCHAR(255),
  ubicacion_region VARCHAR(255),
  ubicacion_ciudad VARCHAR(255),
  ubicacion_sublocalidad VARCHAR(255),
  ubicacion_calle VARCHAR(255),
  ubicacion_numero_casa VARCHAR(50),
  ubicacion_subpremise VARCHAR(100),
  ubicacion_codigo_postal VARCHAR(20),

  -- Participantes y asistentes (JSONB porque son arrays de objetos)
  participantes JSONB DEFAULT '[]'::jsonb,
  asistentes JSONB DEFAULT '[]'::jsonb,

  -- Conferencia
  conferencia_cliente VARCHAR(255),
  conferencia_url TEXT,
  conferencia_id VARCHAR(255),

  -- Calendario
  ocupado BOOLEAN DEFAULT false,

  -- Estado
  activo BOOLEAN DEFAULT true,

  -- Fechas de control
  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW(),

  -- Company ID de Pipedrive
  pipedrive_company_id INTEGER
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pip_activities_pipedrive_id ON pip_activities(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_activities_tipo ON pip_activities(tipo);
CREATE INDEX IF NOT EXISTS idx_pip_activities_persona_id ON pip_activities(persona_id);
CREATE INDEX IF NOT EXISTS idx_pip_activities_organizacion_id ON pip_activities(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_pip_activities_trato_id ON pip_activities(trato_id);
CREATE INDEX IF NOT EXISTS idx_pip_activities_propietario_id ON pip_activities(propietario_id);
CREATE INDEX IF NOT EXISTS idx_pip_activities_completado ON pip_activities(completado);
CREATE INDEX IF NOT EXISTS idx_pip_activities_fecha_vencimiento ON pip_activities(fecha_vencimiento);

-- Comentario de tabla
COMMENT ON TABLE pip_activities IS 'Tabla de actividades sincronizada con Pipedrive Activities API';
