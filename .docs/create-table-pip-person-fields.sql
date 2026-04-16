-- =====================================================
-- Tabla: pip_person_fields
-- Basada en la estructura del endpoint PersonFields de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-13
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_person_fields (
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

CREATE INDEX IF NOT EXISTS idx_pip_person_fields_pipedrive_id ON pip_person_fields(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_person_fields_clave ON pip_person_fields(clave);
CREATE INDEX IF NOT EXISTS idx_pip_person_fields_nombre ON pip_person_fields(nombre);

COMMENT ON TABLE pip_person_fields IS 'Tabla de campos custom de personas sincronizada con Pipedrive PersonFields API';
