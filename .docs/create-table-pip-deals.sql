-- =====================================================
-- Tabla: pip_deals
-- Basada en la estructura del endpoint Deals de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_deals (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  titulo VARCHAR(500),
  valor NUMERIC(15,2),
  moneda VARCHAR(10),
  estado VARCHAR(50),
  etapa_id INTEGER,
  pipeline_id INTEGER,

  persona_id INTEGER,
  organizacion_id INTEGER,
  propietario_id INTEGER,
  creador_id INTEGER,

  fecha_cierre TIMESTAMP,
  won_time TIMESTAMP,
  lost_time TIMESTAMP,
  expected_close_date DATE,
  stage_change_time TIMESTAMP,

  probabilidad INTEGER,
  razon_perdida TEXT,
  activo BOOLEAN DEFAULT true,
  eliminado BOOLEAN DEFAULT false,

  products_count INTEGER DEFAULT 0,
  files_count INTEGER DEFAULT 0,
  notes_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  email_messages_count INTEGER DEFAULT 0,
  activities_count INTEGER DEFAULT 0,
  done_activities_count INTEGER DEFAULT 0,
  undone_activities_count INTEGER DEFAULT 0,

  etiqueta VARCHAR(100),
  visible_para INTEGER,

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_deals_pipedrive_id ON pip_deals(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_deals_titulo ON pip_deals(titulo);
CREATE INDEX IF NOT EXISTS idx_pip_deals_estado ON pip_deals(estado);
CREATE INDEX IF NOT EXISTS idx_pip_deals_etapa_id ON pip_deals(etapa_id);
CREATE INDEX IF NOT EXISTS idx_pip_deals_pipeline_id ON pip_deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pip_deals_persona_id ON pip_deals(persona_id);
CREATE INDEX IF NOT EXISTS idx_pip_deals_organizacion_id ON pip_deals(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_pip_deals_propietario_id ON pip_deals(propietario_id);

COMMENT ON TABLE pip_deals IS 'Tabla de tratos sincronizada con Pipedrive Deals API';
