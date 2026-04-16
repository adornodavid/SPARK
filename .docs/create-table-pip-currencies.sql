-- =====================================================
-- Tabla: pip_currencies
-- Basada en la estructura del endpoint Currencies de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_currencies (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  codigo VARCHAR(10),
  nombre VARCHAR(100),
  simbolo VARCHAR(10),
  decimales INTEGER,
  activo BOOLEAN DEFAULT true,
  es_custom BOOLEAN DEFAULT false,

  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_currencies_pipedrive_id ON pip_currencies(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_currencies_codigo ON pip_currencies(codigo);
CREATE INDEX IF NOT EXISTS idx_pip_currencies_nombre ON pip_currencies(nombre);

COMMENT ON TABLE pip_currencies IS 'Tabla de monedas sincronizada con Pipedrive Currencies API';
