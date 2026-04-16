-- =====================================================
-- Tabla: pip_notes
-- Basada en la estructura del endpoint Notes de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-09
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_notes (
  -- Identificador interno SPARK
  id SERIAL PRIMARY KEY,

  -- Identificador Pipedrive
  pipedrive_id INTEGER UNIQUE,

  -- Contenido
  contenido TEXT,

  -- Relaciones
  trato_id INTEGER,
  trato_titulo VARCHAR(255),
  lead_id VARCHAR(255),
  persona_id INTEGER,
  persona_nombre VARCHAR(255),
  organizacion_id INTEGER,
  organizacion_nombre VARCHAR(255),
  proyecto_id INTEGER,
  proyecto_titulo VARCHAR(255),

  -- Creador
  usuario_id INTEGER,
  usuario_nombre VARCHAR(255),
  usuario_email VARCHAR(255),
  ultimo_editor_id INTEGER,

  -- Pinned flags
  fijado_trato BOOLEAN DEFAULT false,
  fijado_organizacion BOOLEAN DEFAULT false,
  fijado_persona BOOLEAN DEFAULT false,
  fijado_proyecto BOOLEAN DEFAULT false,
  fijado_lead BOOLEAN DEFAULT false,

  -- Estado
  activo BOOLEAN DEFAULT true,

  -- Fechas de control
  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pip_notes_pipedrive_id ON pip_notes(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_notes_trato_id ON pip_notes(trato_id);
CREATE INDEX IF NOT EXISTS idx_pip_notes_persona_id ON pip_notes(persona_id);
CREATE INDEX IF NOT EXISTS idx_pip_notes_organizacion_id ON pip_notes(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_pip_notes_usuario_id ON pip_notes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pip_notes_activo ON pip_notes(activo);

-- Comentario de tabla
COMMENT ON TABLE pip_notes IS 'Tabla de notas sincronizada con Pipedrive Notes API';
