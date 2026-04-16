-- =====================================================
-- Tabla: pip_product_fields
-- Basada en la estructura del endpoint ProductFields de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_product_fields (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  clave VARCHAR(100),
  nombre VARCHAR(255),
  tipo VARCHAR(50),
  grupo_id INTEGER,
  orden INTEGER,
  activo BOOLEAN DEFAULT true,
  editable BOOLEAN DEFAULT true,
  bulk_edit_allowed BOOLEAN DEFAULT true,
  obligatorio BOOLEAN DEFAULT false,
  options JSONB,

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_product_fields_pipedrive_id ON pip_product_fields(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_product_fields_clave ON pip_product_fields(clave);
CREATE INDEX IF NOT EXISTS idx_pip_product_fields_nombre ON pip_product_fields(nombre);

COMMENT ON TABLE pip_product_fields IS 'Tabla de campos custom de productos sincronizada con Pipedrive ProductFields API';
