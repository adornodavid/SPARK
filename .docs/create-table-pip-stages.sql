-- =====================================================
-- Tabla: pip_stages
-- Basada en la estructura del endpoint Stages de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_stages (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  nombre VARCHAR(255),
  pipeline_id INTEGER,
  pipeline_name VARCHAR(255),
  orden INTEGER,
  probabilidad INTEGER,
  rotten BOOLEAN DEFAULT false,
  rotten_days INTEGER,
  activo BOOLEAN DEFAULT true,

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_stages_pipedrive_id ON pip_stages(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_stages_nombre ON pip_stages(nombre);
CREATE INDEX IF NOT EXISTS idx_pip_stages_pipeline_id ON pip_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pip_stages_activo ON pip_stages(activo);

COMMENT ON TABLE pip_stages IS 'Tabla de stages sincronizada con Pipedrive Stages API';
