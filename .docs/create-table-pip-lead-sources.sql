-- =====================================================
-- Tabla: pip_lead_sources
-- Basada en la estructura del endpoint LeadSources de Pipedrive
-- NOTA: Pipedrive devuelve objetos con solo "name". Se usa el name como pipedrive_id.
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_lead_sources (
  id SERIAL PRIMARY KEY,
  pipedrive_id VARCHAR(255) UNIQUE,

  nombre VARCHAR(255),

  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_lead_sources_pipedrive_id ON pip_lead_sources(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_lead_sources_nombre ON pip_lead_sources(nombre);

COMMENT ON TABLE pip_lead_sources IS 'Tabla de lead sources sincronizada con Pipedrive LeadSources API';
