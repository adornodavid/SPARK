-- =====================================================
-- Tabla: pip_products
-- Basada en la estructura del endpoint Products de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_products (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  nombre VARCHAR(500),
  codigo VARCHAR(100),
  unidad VARCHAR(100),
  impuesto NUMERIC(10,2),
  categoria VARCHAR(255),
  descripcion TEXT,
  selectable BOOLEAN DEFAULT true,
  primer_caracter VARCHAR(5),
  visible_para INTEGER,
  propietario_id INTEGER,
  prices JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN DEFAULT true,

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_products_pipedrive_id ON pip_products(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_products_nombre ON pip_products(nombre);
CREATE INDEX IF NOT EXISTS idx_pip_products_codigo ON pip_products(codigo);
CREATE INDEX IF NOT EXISTS idx_pip_products_activo ON pip_products(activo);

COMMENT ON TABLE pip_products IS 'Tabla de productos sincronizada con Pipedrive Products API';
