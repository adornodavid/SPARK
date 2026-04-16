-- =====================================================
-- Tabla: pip_permission_sets
-- Basada en la estructura del endpoint PermissionSets de Pipedrive
-- NOTA: id Pipedrive es UUID, se usa VARCHAR(50)
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_permission_sets (
  id SERIAL PRIMARY KEY,
  pipedrive_id VARCHAR(50) UNIQUE,

  nombre VARCHAR(255),
  description TEXT,
  app VARCHAR(50),
  tipo VARCHAR(50),
  asignaciones_count INTEGER DEFAULT 0,

  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_permission_sets_pipedrive_id ON pip_permission_sets(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_permission_sets_nombre ON pip_permission_sets(nombre);

COMMENT ON TABLE pip_permission_sets IS 'Tabla de permission sets sincronizada con Pipedrive PermissionSets API';
