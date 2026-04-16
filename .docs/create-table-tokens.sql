-- =====================================================
-- Tabla: tokens
-- Tokens genéricos (no atados a usuarios). Usado hoy para
-- recuperación de contraseña; reutilizable para otros flujos.
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL,
  fechacreacion DATE DEFAULT CURRENT_DATE,
  fechavencimiento DATE NOT NULL,
  activo BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_activo ON tokens(activo);

COMMENT ON TABLE tokens IS 'Tokens genéricos encriptados. Reutilizable para recuperación de contraseña y otros procesos.';
