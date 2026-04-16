-- =====================================================
-- Tabla: pip_tasks
-- Basada en la estructura del endpoint Tasks de Pipedrive
-- Proyecto: SPARK
-- Fecha: 2026-04-09
-- =====================================================

CREATE TABLE IF NOT EXISTS pip_tasks (
  -- Identificador interno SPARK
  id SERIAL PRIMARY KEY,

  -- Identificador Pipedrive
  pipedrive_id INTEGER UNIQUE,

  -- Datos básicos
  titulo VARCHAR(500),
  descripcion TEXT,

  -- Relaciones
  proyecto_id INTEGER,
  tarea_padre_id INTEGER,

  -- Asignaciones
  asignado_id INTEGER,
  asignado_ids JSONB DEFAULT '[]'::jsonb,
  creador_id INTEGER,

  -- Estado
  completado BOOLEAN DEFAULT false,
  fecha_completado TIMESTAMP,

  -- Fechas
  fecha_vencimiento DATE,

  -- Fechas de control
  pipedrive_add_time TIMESTAMP,
  pipedrive_update_time TIMESTAMP,
  fechacreacion TIMESTAMP DEFAULT NOW(),
  fechaactualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pip_tasks_pipedrive_id ON pip_tasks(pipedrive_id);
CREATE INDEX IF NOT EXISTS idx_pip_tasks_proyecto_id ON pip_tasks(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_pip_tasks_asignado_id ON pip_tasks(asignado_id);
CREATE INDEX IF NOT EXISTS idx_pip_tasks_creador_id ON pip_tasks(creador_id);
CREATE INDEX IF NOT EXISTS idx_pip_tasks_completado ON pip_tasks(completado);
CREATE INDEX IF NOT EXISTS idx_pip_tasks_fecha_vencimiento ON pip_tasks(fecha_vencimiento);

-- Comentario de tabla
COMMENT ON TABLE pip_tasks IS 'Tabla de tareas sincronizada con Pipedrive Tasks API';
