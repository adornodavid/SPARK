-- =====================================================
-- Tabla: pip_filters
-- Basada en la estructura del endpoint Filters de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_filters (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  nombre VARCHAR(255),
  tipo VARCHAR(50),
  usuario_id INTEGER,
  visible_para INTEGER,
  activo BOOLEAN DEFAULT true,
  custom_view_id INTEGER,
  temporal BOOLEAN DEFAULT false,

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_filters_pipedrive_id ON pip_filters(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_filters_nombre ON pip_filters(nombre);
CREATE INDEX IF NOT EXISTS idx_pip_filters_tipo ON pip_filters(tipo);
CREATE INDEX IF NOT EXISTS idx_pip_filters_usuario_id ON pip_filters(usuario_id);

COMMENT ON TABLE pip_filters IS 'Tabla de filtros sincronizada con Pipedrive Filters API';
