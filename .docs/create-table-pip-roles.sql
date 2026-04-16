-- =====================================================
-- Tabla: pip_roles
-- Basada en la estructura del endpoint Roles de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_roles (
  id SERIAL PRIMARY KEY,
  pipedrive_id INTEGER UNIQUE,

  nombre VARCHAR(255),
  rol_padre_id INTEGER,
  activo BOOLEAN DEFAULT true,
  assignment_count INTEGER DEFAULT 0,
  sub_role_count INTEGER DEFAULT 0,

  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pip_roles_pipedrive_id ON pip_roles(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_roles_nombre ON pip_roles(nombre);

COMMENT ON TABLE pip_roles IS 'Tabla de roles sincronizada con Pipedrive Roles API';
