-- =====================================================
-- Tabla: pip_pipelines
-- Basada en la estructura del endpoint Pipelines de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_pipelines (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  nombre VARCHAR(255),
  url_title VARCHAR(255),
  orden INTEGER,
  probabilidad BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_pipelines_pipedrive_id ON pip_pipelines(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_pipelines_nombre ON pip_pipelines(nombre);
CREATE INDEX IF NOT EXISTS idx_pip_pipelines_activo ON pip_pipelines(activo);

COMMENT ON TABLE pip_pipelines IS 'Tabla de pipelines sincronizada con Pipedrive Pipelines API';
