-- =====================================================
-- Tabla: pip_lead_labels
-- Basada en la estructura del endpoint LeadLabels de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_lead_labels (
  id SERIAL PRIMARY KEY,
  pipedrive_id VARCHAR(50) UNIQUE,

  nombre VARCHAR(255),
  color VARCHAR(50),

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_lead_labels_pipedrive_id ON pip_lead_labels(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_lead_labels_nombre ON pip_lead_labels(nombre);

COMMENT ON TABLE pip_lead_labels IS 'Tabla de lead labels sincronizada con Pipedrive LeadLabels API';
