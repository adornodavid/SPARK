-- =====================================================
-- Tabla: pip_activity_types
-- Basada en la estructura del endpoint ActivityTypes de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_activity_types (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  nombre VARCHAR(255),
  clave VARCHAR(100),
  icono VARCHAR(100),
  color VARCHAR(20),
  orden INTEGER,
  es_custom BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,

  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_activity_types_pipedrive_id ON pip_activity_types(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_activity_types_nombre ON pip_activity_types(nombre);
CREATE INDEX IF NOT EXISTS idx_pip_activity_types_activo ON pip_activity_types(activo);

COMMENT ON TABLE pip_activity_types IS 'Tabla de tipos de actividad sincronizada con Pipedrive ActivityTypes API';
