-- =====================================================
-- Tabla: pip_leads
-- Basada en la estructura del endpoint Leads de Pipedrive
-- NOTA: id Pipedrive es UUID, se usa VARCHAR(50)
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_leads (
  id SERIAL PRIMARY KEY,
  pipedrive_id VARCHAR(50) UNIQUE,

  titulo VARCHAR(500),
  propietario_id INTEGER,
  creador_id INTEGER,
  label_ids JSONB DEFAULT '[]'::jsonb,

  persona_id INTEGER,
  organizacion_id INTEGER,

  origen_nombre VARCHAR(255),
  valor JSONB,
  expected_close_date DATE,

  archivado BOOLEAN DEFAULT false,
  visto BOOLEAN DEFAULT false,

  visible_para INTEGER,
  channel INTEGER,
  channel_id VARCHAR(100),

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_leads_pipedrive_id ON pip_leads(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_leads_titulo ON pip_leads(titulo);
CREATE INDEX IF NOT EXISTS idx_pip_leads_propietario_id ON pip_leads(propietario_id);
CREATE INDEX IF NOT EXISTS idx_pip_leads_persona_id ON pip_leads(persona_id);
CREATE INDEX IF NOT EXISTS idx_pip_leads_organizacion_id ON pip_leads(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_pip_leads_archivado ON pip_leads(archivado);

COMMENT ON TABLE pip_leads IS 'Tabla de leads sincronizada con Pipedrive Leads API';
