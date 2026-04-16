-- =====================================================
-- Tabla: pip_files
-- Basada en la estructura del endpoint Files de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_files (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  nombre VARCHAR(500),
  archivo_nombre VARCHAR(500),
  file_size BIGINT,
  tipo VARCHAR(100),
  url TEXT,
  remote_location VARCHAR(100),
  remote_id VARCHAR(255),

  deal_id INTEGER,
  person_id INTEGER,
  org_id INTEGER,
  activity_id INTEGER,
  lead_id VARCHAR(50),
  product_id INTEGER,
  usuario_id INTEGER,

  inline BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_files_pipedrive_id ON pip_files(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_files_nombre ON pip_files(nombre);
CREATE INDEX IF NOT EXISTS idx_pip_files_deal_id ON pip_files(deal_id);
CREATE INDEX IF NOT EXISTS idx_pip_files_person_id ON pip_files(person_id);
CREATE INDEX IF NOT EXISTS idx_pip_files_org_id ON pip_files(org_id);
CREATE INDEX IF NOT EXISTS idx_pip_files_activity_id ON pip_files(activity_id);
CREATE INDEX IF NOT EXISTS idx_pip_files_activo ON pip_files(activo);

COMMENT ON TABLE pip_files IS 'Tabla de archivos sincronizada con Pipedrive Files API';
