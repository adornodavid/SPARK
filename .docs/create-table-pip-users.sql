-- =====================================================
-- Tabla: pip_users
-- Basada en la estructura del endpoint Users de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_users (
  -- Identificador interno SPARK
  id SERIAL PRIMARY KEY,

  -- Identificador Pipedrive
  pipedrive_id INTEGER UNIQUE,

  -- Datos básicos
  nombre VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(50),

  -- Permisos / roles
  admin BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  rol_id INTEGER,

  -- Localización
  zona_horaria VARCHAR(100),
  zona_horaria_offset VARCHAR(20),
  idioma VARCHAR(50),
  lang VARCHAR(20),
  moneda_default VARCHAR(10),

  -- Misc
  icono_url TEXT,
  ultima_conexion TIMESTAMP,
  ha_creado_empresa BOOLEAN DEFAULT false,
  accesos JSONB DEFAULT '[]'::jsonb,

  -- Fechas de control
  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW(),

  -- Company ID de Pipedrive
  pipedrive_company_id INTEGER
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pip_users_pipedrive_id ON pip_users(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_users_nombre ON pip_users(nombre);
CREATE INDEX IF NOT EXISTS idx_pip_users_email ON pip_users(email);
CREATE INDEX IF NOT EXISTS idx_pip_users_activo ON pip_users(activo);

-- Comentario de tabla
COMMENT ON TABLE pip_users IS 'Tabla de usuarios del CRM sincronizada con Pipedrive Users API';
