-- =====================================================
-- Tabla: persons
-- Basada en la estructura del endpoint Persons de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-06
-- =====================================================

CREATE TABLE IF NOT EXISTS persons (
  -- Identificador interno SPARK
  id SERIAL PRIMARY KEY,

  -- Identificador Pipedrive
  pipedrive_id INTEGER UNIQUE,

  -- Datos básicos
  nombre VARCHAR(255),
  primer_nombre VARCHAR(150),
  apellidos VARCHAR(150),
  puesto VARCHAR(255),

  -- Contacto (JSONB porque Pipedrive maneja arrays con label/value/primary)
  email JSONB DEFAULT '[]'::jsonb,
  telefono JSONB DEFAULT '[]'::jsonb,
  mensajeria_instantanea VARCHAR(255),

  -- Organización
  organizacion_id INTEGER,
  organizacion_nombre VARCHAR(255),

  -- Propietario (usuario de Pipedrive)
  propietario_id INTEGER,
  propietario_nombre VARCHAR(255),

  -- Dirección postal
  direccion_postal TEXT,
  direccion_subpremise VARCHAR(100),
  direccion_numero_casa VARCHAR(50),
  direccion_calle VARCHAR(255),
  direccion_sublocalidad VARCHAR(255),
  direccion_ciudad VARCHAR(255),
  direccion_estado VARCHAR(255),
  direccion_region VARCHAR(255),
  direccion_pais VARCHAR(255),
  direccion_codigo_postal VARCHAR(20),
  direccion_completa TEXT,

  -- Dirección personalizada (campo custom Pipedrive)
  direccion_custom TEXT,
  direccion_custom_ciudad VARCHAR(255),
  direccion_custom_estado VARCHAR(255),
  direccion_custom_pais VARCHAR(255),
  direccion_custom_codigo_postal VARCHAR(20),
  direccion_custom_completa TEXT,

  -- Campos personalizados de Pipedrive
  division_filial_area TEXT,
  tipo_contacto VARCHAR(100),
  tipo_reservas JSONB,
  potencial_mensual_cn JSONB,
  cumpleanos DATE,
  afiliado_fidelizacion JSONB,
  whatsapp_chat_link VARCHAR(500),

  -- Estadísticas (readonly desde Pipedrive)
  tratos_abiertos INTEGER DEFAULT 0,
  tratos_cerrados INTEGER DEFAULT 0,
  tratos_ganados INTEGER DEFAULT 0,
  tratos_perdidos INTEGER DEFAULT 0,
  actividades_total INTEGER DEFAULT 0,
  actividades_completadas INTEGER DEFAULT 0,
  actividades_pendientes INTEGER DEFAULT 0,
  emails_count INTEGER DEFAULT 0,

  -- Marketing
  marketing_status VARCHAR(50),

  -- Etiquetas
  etiqueta VARCHAR(100),
  etiqueta_ids JSONB DEFAULT '[]'::jsonb,

  -- Notas
  notas TEXT,

  -- Foto
  foto_id INTEGER,

  -- Visibilidad
  visible_para INTEGER,

  -- Fechas de actividad
  fecha_proxima_actividad DATE,
  fecha_ultima_actividad DATE,
  ultimo_email_recibido TIMESTAMP,
  ultimo_email_enviado TIMESTAMP,

  -- Estado
  activo BOOLEAN DEFAULT true,

  -- Fechas de control
  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  pipedrive_delete_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW(),

  -- Hash keys de campos personalizados (referencia para mapeo)
  -- 50911942c... = Division / Filial / Area
  -- cef83686b... = Tipo de Contacto
  -- b69ae48b0... = Tipo de reservas que hace?
  -- aa2812f83... = Potencial mensual en CN
  -- e645f305b... = CUMPLEAÑOS
  -- 8026c65fb... = Afiliado a Programa de Fidelización
  -- a3e32f528... = Whatsapp chat link
  -- be06a8605... = Direccion custom (con subcampos)

  -- Company ID de Pipedrive
  pipedrive_company_id INTEGER
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_persons_pipedrive_id ON persons(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_persons_nombre ON persons(nombre);
CREATE INDEX IF NOT EXISTS idx_persons_organizacion_id ON persons(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_persons_propietario_id ON persons(propietario_id);
CREATE INDEX IF NOT EXISTS idx_persons_activo ON persons(activo);

-- Comentario de tabla
COMMENT ON TABLE persons IS 'Tabla de personas/contactos sincronizada con Pipedrive Persons API';
