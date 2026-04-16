# SPARK — Especificacion Tecnica Completa

**Proyecto:** SPARK (Sistema Portal Arkamia - Rebranding)
**Cliente:** MGHM — Hoteles Milenium (cadena de 15 hoteles)
**Responsable:** David Adorno — Arkamia Digital Solutions
**Desarrollador:** Ruben Jasso (siembi.com)
**Fecha creacion:** 2026-02-24
**Ultima actualizacion:** 2026-03-17
**Estado:** LIVE EN PRODUCCION (desarrollo activo)

---

## 1. VISION DEL PRODUCTO

Portal web integral de gestion comercial y banquetes para la cadena hotelera MGHM (15 hoteles). Permite a ejecutivos comerciales gestionar: disponibilidad de salones, cotizaciones instantaneas, CRM de clientes, catalogos de servicios y seguimiento de ventas.

### Problema que resuelve
- Tiempos de respuesta de cotizacion de 15-30 dias
- Sin visibilidad multi-propiedad (vendedor no ve disponibilidad de otros hoteles)
- Sin CRM centralizado
- Proceso manual de calculo de costos

### Concepto clave: Vendedor Multipropiedad
Un ejecutivo comercial puede ver y cotizar salones de CUALQUIER hotel de la cadena, no solo el suyo. Esto define toda la arquitectura de permisos.

### Flujo completo de negocio
```
Origen → Visita presencial → Demo SPARK en iPad → Disponibilidad en vivo
→ CRM (captura cliente) → Cotizacion instantanea → PDF profesional
→ Email al cliente → Follow-up → Pago → Reservacion confirmada
```

### Tipos de eventos
- **Social:** Bodas, XV anos, bautizos, cumpleanos, graduaciones
- **Corporativo:** Conferencias, capacitaciones, cenas de fin de ano, lanzamientos

---

## 2. CONEXIONES Y ACCESOS

### Vercel — v0-portal-comercial-and-banquetes (PRODUCCION)
| Campo | Valor |
|-------|-------|
| Proyecto | v0-portal-comercial-and-banquetes |
| Project ID | prj_WrF8PnNFuzpw8OpSa2L9vFtPejhO |
| URL Produccion | https://comercial-banquetes-habitaciones.vercel.app |
| URL Alternativa | https://v0-portal-comercial-and-banquetes.vercel.app |
| Account | arkamiaeip (team_DFlhS1OFbGUsPUIlOnGK1MWg) |
| Cron | `/api/cron/liberar-fechas` — daily 6am UTC |
| Auto-deploy | GitHub → Vercel (push to main o RubenBranch) |
| Bundler | Turbopack |
| Node | 24.x |

> **NOTA:** Existe un proyecto viejo `sparkmilenium` en Vercel — ya NO es el principal. El proyecto activo es `v0-portal-comercial-and-banquetes`.

### GitHub
| Campo | Valor |
|-------|-------|
| Repo | adornodavid/SPARK |
| Visibilidad | Publico |
| URL | https://github.com/adornodavid/SPARK |
| Branch produccion | main |
| Branch desarrollo | RubenBranch |
| Auto-deploy | Ambos branches despliegan a Vercel |

### Supabase — SPARK_Comercial
| Campo | Valor |
|-------|-------|
| Proyecto | SPARK_Comercial |
| ID | yfisrqlhnlryramfdtwy |
| URL | https://yfisrqlhnlryramfdtwy.supabase.co |
| Host DB | db.yfisrqlhnlryramfdtwy.supabase.co:5432 |
| Database | postgres |
| Password DB | Arkamia2026. |

### Repositorio Local (disco duro externo — documentacion)
- **Path:** `/Volumes/G-DRIVE slim/Proyectos Claude Code/Desarrollos Empresariales/SPARK/`
- **Nota:** El codigo fuente vive en GitHub. Este directorio contiene documentacion y referencia.

---

## 3. TECH STACK

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.0.10 |
| UI | React | 19.2.0 |
| Lenguaje | TypeScript (strict, ignoreBuildErrors: false) | 5.x |
| Estilos | Tailwind CSS v4 | 4.1.9 |
| Componentes | Shadcn/ui (New York theme) | Latest |
| Iconos | Lucide React | 0.454.0 |
| Graficas | Recharts | 2.15.4 |
| Base de datos | Supabase (SSR) | 2.86.0 |
| Auth | Custom (bcrypt 3.0.3 + AES crypto-js 4.2.0) | N/A |
| Dark mode | next-themes | 0.4.6 |
| Formularios | React Hook Form + Zod | 7.x + 3.25.76 |
| PDF | jsPDF | 2.5.2 |
| Email | Nodemailer (SMTP) | Latest |
| Fechas | date-fns | 4.1.0 |
| Command Palette | cmdk | 1.0.4 |
| Toast | Sonner | 1.7.4 |
| Deploy | Vercel (Turbopack) | N/A |

### Autenticacion
**NO usa Supabase Auth.** Usa sistema custom:
- Passwords hasheados con bcrypt (tabla `usuarios`)
- Sesion encriptada con AES (crypto-js) en cookie HTTP-only
- Middleware Edge Runtime valida existencia de cookie (no decrypt)
- Server actions validan sesion completa (decrypt + verify)

---

## 4. DESIGN SYSTEM

### Paleta de colores
| Token | Uso |
|-------|-----|
| `bg-card` | Fondos de tarjetas |
| `bg-muted` | Fondos secundarios |
| `text-foreground` | Texto principal |
| `text-muted-foreground` | Texto secundario |
| `border` | Bordes generales |
| `lime-600` / `lime-500` | Acento primario SPARK |

### Patrones visuales
- **CTA buttons:** `bg-foreground text-background hover:bg-foreground/90`
- **Cards:** `rounded-xl` con clase `spark-card` (glassmorphism)
- **Header:** Glassmorphism con blur
- **Sidebar:** Dark background con acentos lime
- **Dark mode:** Activado via ThemeProvider (attribute="class"), toggle Sun/Moon

### Componentes clave
- Toast notifications via Sonner (reemplazo de alert() nativo)
- Loading skeletons en paginas principales
- Error pages con branding SPARK
- Command Palette global (Cmd+K)
- **95+ componentes** organizados por modulo en components/admin/
- **50+ componentes UI** (Shadcn/Radix primitives)

### Componentes nuevos (post-Fase 13)
```
components/admin/
  packages/
    paquete-form-nuevo.tsx     — Form con TIPOS_PAQUETE enum
    paquete-detalle.tsx        — Vista detalle/edicion
    paquetes-grid.tsx          — Grid con filtros
  quotations/
    quotation-editor.tsx       — Editor principal mejorado
    quotation-detail-modal.tsx — Modal detalle
    quotations-filter.tsx      — Filtros de cotizaciones
    quotation-edit-form.tsx    — Form edicion con fix race condition
```

---

## 5. ESTRUCTURA DE ARCHIVOS

### Server Actions (21 archivos)
```
app/actions/
  auth.ts            — Login, logout, validacion de sesion
  session.ts         — Manejo de cookie encriptada (crear, obtener, eliminar)
  calendario.ts      — Eventos del calendario, por dia, por rango
  catalogos.ts       — **40+ funciones** de elementos: paquetes, complementos, cortesias,
                        platillos, audiovisual, lugares, asignacion a cotizaciones
  clientes.ts        — CRUD clientes + dropdown
  configuraciones.ts — Config del sistema (IVA, moneda, preferencias, roles)
  convenios.ts       — CRUD convenios (escribe en ingles, lee de vista), renovacion
  cotizaciones.ts    — CRUD cotizaciones, wizard, folios, disponibilidad, categorias evento
  crm.ts             — Dashboard CRM, pipeline kanban, actividades, busqueda global
  habitaciones.ts    — CRUD habitaciones y categorias
  hoteles.ts         — CRUD hoteles + dropdown
  menus.ts           — CRUD categorias y items de menu
  pagos.ts           — Upload comprobantes, confirmacion, liberacion fechas
  paquetes.ts        — CRUD paquetes (9 funciones), tipos, dropdown, activo toggle
  pdf.ts             — Generacion PDF profesional (buffer + descarga)
  recordatorios.ts   — Recordatorios por email, cotizaciones por vencer
  reservaciones.ts   — CRUD reservaciones, disponibilidad salon, por dia
  salones.ts         — CRUD salones y montajes, upload/eliminar archivos
  setup-admin.ts     — Setup inicial de admin
  usuarios.ts        — CRUD usuarios, toggle activo, dropdown
  utilerias.ts       — Imagen subir, Encrypt, Decrypt, Hash, CompareHash
```

> **catalogos.ts es el archivo mas complejo** — maneja la logica de elementos por tipo
> (Lugar, Alimento, Bebidas, Cortesias, Servicio, Mobiliario, Audiovisual, Complemento,
> Beneficios Adicionales) y la asignacion de paquetes/elementos a cotizaciones.

### API Routes
```
app/api/
  cron/liberar-fechas/route.ts  — Cron diario: vence cotizaciones expiradas
  enviar-cotizacion/route.ts    — Envio de cotizacion por email
  salones/route.ts              — Endpoint de salones
```

### Paginas (60+ rutas)
```
/ (landing publica)
/auth/login, /auth/sign-up, /auth/forgot-password, /auth/error, /auth/sign-up-success

/(protected)/
  dashboard/              — KPIs, calendario, eventos proximos
  salones/                — Lista, detalle, nuevo, editar (128 salones, 835 montajes)
  cotizaciones/           — Lista, detalle, nuevo (wizard), editar, resumen, edicion, new-2
  cotizarevento/          — Flujo rapido cotizar evento
  reservaciones/          — Lista, detalle, nuevo, editar
  clientes/               — Lista, detalle, nuevo, editar
  hoteles/                — Lista, detalle, nuevo
  habitaciones/           — Lista, detalle, nuevo + room-categories
  menus/                  — Lista, categorias (CRUD), items (CRUD)
  packages/               — Paquetes de eventos (CRUD) — tipos Simple/Completo
  agreements/             — Convenios corporativos (CRUD)
  crm/                    — Dashboard, Pipeline Kanban, Cliente 360, Actividades
  configuraciones/        — Usuarios, Hoteles, General (IVA, moneda), Preferencias
  reportes/               — Reportes gerenciales
  landing/                — Landing de salones + landingsalones (fullscreen)
  admin/                  — Panel admin
  setup-admin/            — Setup inicial admin
  encryption/             — Utilidad de encriptacion
```

---

## 6. BASE DE DATOS — ESQUEMA REAL

### Advertencia critica sobre esquema
Las tablas fueron creadas originalmente por v0 con columnas en INGLES. El codigo SPARK espera nombres en ESPANOL. Se resolvio con:
1. **VIEWs** que mapean ingles → espanol para SELECTs
2. **Server actions** que escriben usando nombres reales (ingles) de la BD
3. **ALTER TABLE** para agregar columnas faltantes

### Regla de oro
> **Siempre verificar `information_schema.columns` antes de escribir SQL migrations.**
> `CREATE TABLE IF NOT EXISTS` NO falla si la tabla existe con columnas diferentes.

### Tablas principales

| Tabla | PK | Notas |
|-------|-----|-------|
| `hoteles` | `id` (integer) | **PK es `id`, NO `hotelid`**. Vista `vw_ohoteles` renombra a `hotelid` |
| `salones` | `id` | 128 salones de 14 hoteles |
| `montajesxsalon` | `id` | 835 montajes vinculados a salones |
| `cotizaciones` | `id` | Incluye campo `comprobantespago` (jsonb) para pagos |
| `reservaciones` | `id` | Campos `cotizacionid` y `tipoevento` agregados |
| `clientes` | `id` | Datos de contacto |
| `usuarios` | `id` | 4 usuarios activos. Passwords hasheados con bcrypt |
| `convenios` | `id` | **Columnas en INGLES** (company_name, hotel_id, etc.) + nuevas en espanol |
| `configuraciones` | `id` | Campos `clave` y `hotelid` agregados via ALTER TABLE |
| `paquetes` | `id` | Tipos: Boda, Corporativo, Social, XV Años, Graduación, Convención, Cóctel, Otro. Campo `tipo` para Simple/Completo |
| `elementosxpaquete` | `id` | **NUEVO** — Elementos que incluye un paquete (paqueteid, elementoid, tipoelemento, destacado, orden) |
| `elementosxcotizacion` | `id` | **NUEVO** — Elementos asignados a una cotizacion (cotizacionid, hotelid, elementoid, tipoelemento, destacado, orden) |
| `complementos` | `id` | **NUEVO** — Complementos por hotel (nombre, descripcion, costo, cantidad, unidad, imgurl) |
| `cortesias` | `id` | **NUEVO** — Cortesias/atenciones (como tipoelemento en elementosxcotizacion) |
| `platillositems` | `id` | **NUEVO** — Items de platillos (nombre, descripcion, costo, horas, hotelid, tipo, documentopdf) |
| `menu_categories` | `id` | 8 categorias seed |
| `menu_items` | `id` | Items de menu |
| `actividades` | `id` | Actividades CRM |
| `cargasalones` | `id` | Tabla staging original (datos ya migrados a salones) |

### Vistas (mapeo ingles → espanol)

| Vista | Tabla base | Proposito |
|-------|-----------|-----------|
| `vw_ohoteles` | hoteles | Renombra `id` → `hotelid`, mapea columnas |
| `vw_oconvenios` | convenios | Mapea company_name→empresa, hotel_id→hotelid, etc. |
| `vw_opaquetes` | paquetes | JOIN con hoteles para incluir nombre del hotel |
| `vw_osalones` | salones | Vista de salones con datos formateados |
| `vw_ocotizaciones` | cotizaciones | Vista de cotizaciones |
| `vw_omontajesxsalon` | montajesxsalon | Vista de montajes |

### Arquitectura de Elementos (NUEVO)

Las cotizaciones y paquetes ahora usan un sistema flexible de elementos por tipo:

```
tipoelemento values:
  - "Lugar"                    — Salones y espacios
  - "Alimento" / "Platillo"   — Platillos items (con PDF adjunto)
  - "Bebidas"                  — Paquetes de bebidas
  - "Cortesias"                — Atenciones cortesia
  - "Servicio"                 — Servicios adicionales
  - "Mobiliario"               — Mesas, sillas, decoracion
  - "Audiovisual"              — Equipo AV
  - "Beneficios Adicionales"   — Extras incluidos
  - "Complemento"              — Complementos con imgurl/PDF
```

**Flujo:**
1. Un **paquete** define elementos default en `elementosxpaquete`
2. Al asignar paquete a cotizacion, los elementos se copian a `elementosxcotizacion`
3. El vendedor puede agregar/eliminar elementos individuales de la cotizacion
4. Cada elemento tiene: elementoid, tipoelemento, destacado, orden

### Convenios — Mapeo de columnas
```
BD (ingles)          → Vista/Codigo (espanol)
company_name         → empresa
contact_name         → contacto
contact_email        → email
contact_phone        → telefono
hotel_id             → hotelid
start_date           → vigencia_inicio
end_date             → vigencia_fin
status               → estado
terms                → condiciones
notes                → notas
discount_percentage  → descuento_porcentaje
created_at           → fecha_creacion
updated_at           → fecha_actualizacion
-- Columnas nuevas (ya en espanol):
tipo_descuento, descuento_valor, aplica_a, version, convenio_padre_id, activo
```

### Scripts SQL
```
scripts/
  MIGRATION-FINAL.sql      — Script unico que reemplaza todos los demas. Idempotente.
  security-rls.sql         — Politicas RLS (ya aplicado en produccion)
  env-checklist.md         — Documentacion de variables de entorno
  -- Los siguientes son OBSOLETOS (reemplazados por MIGRATION-FINAL.sql):
  configuraciones-table.sql
  convenios-tables.sql
  crm-tables.sql
  menus-tables.sql
  paquetes-table.sql
  migrate-salones.mjs
```

### MEJORAS DE BASE DE DATOS — MIGRATIONS PENDIENTES

> **IMPORTANTE:** Todas estas migrations deben crearse en un nuevo archivo `scripts/MIGRATION-V2.sql`.
> Usar `IF NOT EXISTS` para columnas y tablas nuevas. Ejecutar en Supabase SQL Editor.

#### 1. Salones compuestos (relación padre-hijo)
```sql
-- Opción A: Campo en tabla salones (más simple)
ALTER TABLE salones ADD COLUMN IF NOT EXISTS salon_padre_id INTEGER REFERENCES salones(id);
-- salon_padre_id = NULL → salón individual o salón compuesto padre
-- salon_padre_id = X → es componente del salón compuesto X

-- Opción B: Tabla de composición (más flexible, soporta N niveles)
CREATE TABLE IF NOT EXISTS salones_composicion (
  id SERIAL PRIMARY KEY,
  salon_compuesto_id INTEGER NOT NULL REFERENCES salones(id),
  salon_componente_id INTEGER NOT NULL REFERENCES salones(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_compuesto_id, salon_componente_id)
);

-- Ejemplo: Salón "Acero" (id=50) compuesto por A01 (id=51) + A02 (id=52)
-- INSERT INTO salones_composicion (salon_compuesto_id, salon_componente_id) VALUES (50, 51), (50, 52);
```

#### 2. Horas extra en cotizaciones
```sql
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS horas_evento INTEGER DEFAULT 8;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS horas_extra INTEGER DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS costo_hora_extra DECIMAL(12,2) DEFAULT 0;
-- costo_hora_extra = renta_salon / 8 (se calcula al crear cotización)

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS hora_inicio TIME;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS hora_fin TIME;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS hora_montaje TIME;    -- hora_inicio - 1hr
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS hora_desmontaje TIME; -- hora_fin + 1hr
```

#### 3. Sistema de roles granular
```sql
-- Expandir campo rol en usuarios
-- Valores actuales: admin_principal, vendedor, vendedor_full, admin_general
-- Valores nuevos:
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol_v2 TEXT DEFAULT 'asesor'
  CHECK (rol_v2 IN ('super_admin', 'admin', 'director_comercial', 'gerente', 'asesor'));

-- Tabla de permisos configurables (opcional, si se quiere UI de permisos)
CREATE TABLE IF NOT EXISTS permisos_rol (
  id SERIAL PRIMARY KEY,
  rol TEXT NOT NULL,
  accion TEXT NOT NULL,            -- 'crear_cotizacion', 'editar_ajena', 'autorizar_descuento', etc.
  permitido BOOLEAN DEFAULT FALSE,
  limite_valor DECIMAL(12,2),      -- Para descuentos: % máximo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rol, accion)
);

-- Seed de permisos iniciales
INSERT INTO permisos_rol (rol, accion, permitido, limite_valor) VALUES
  ('super_admin', 'eliminar_registros', true, NULL),
  ('super_admin', 'gestionar_usuarios', true, NULL),
  ('super_admin', 'autorizar_descuento', true, 100),
  ('admin', 'gestionar_usuarios', true, NULL),
  ('admin', 'autorizar_descuento', true, 100),
  ('director_comercial', 'autorizar_descuento', true, 50),
  ('director_comercial', 'ver_reportes', true, NULL),
  ('gerente', 'autorizar_descuento', true, 15),   -- TBD: porcentaje exacto
  ('gerente', 'autorizar_bloqueo', true, NULL),
  ('gerente', 'editar_cotizacion_ajena', true, NULL),
  ('asesor', 'crear_cotizacion', true, NULL),
  ('asesor', 'editar_cotizacion_propia', true, NULL)
ON CONFLICT (rol, accion) DO NOTHING;
```

#### 4. Empalmes y conflictos
```sql
CREATE TABLE IF NOT EXISTS empalmes (
  id SERIAL PRIMARY KEY,
  cotizacion_a_id INTEGER NOT NULL REFERENCES cotizaciones(id),
  cotizacion_b_id INTEGER NOT NULL REFERENCES cotizaciones(id),
  salon_id INTEGER NOT NULL REFERENCES salones(id),
  fecha DATE NOT NULL,
  estado TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'resuelto_a', 'resuelto_b', 'cancelado')),
  resolucion TEXT,                  -- Nota de cómo se resolvió
  resuelto_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Índice para búsqueda rápida de empalmes por salón/fecha
CREATE INDEX IF NOT EXISTS idx_empalmes_salon_fecha ON empalmes(salon_id, fecha);
```

#### 5. Autorizaciones de descuento
```sql
CREATE TABLE IF NOT EXISTS autorizaciones_descuento (
  id SERIAL PRIMARY KEY,
  cotizacion_id INTEGER NOT NULL REFERENCES cotizaciones(id),
  solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
  aprobador_id INTEGER REFERENCES usuarios(id),
  porcentaje_solicitado DECIMAL(5,2) NOT NULL,
  monto_descuento DECIMAL(12,2),
  motivo TEXT,
  estado TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'escalado')),
  escalado_a INTEGER REFERENCES usuarios(id),  -- Si gerente escala a director
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

#### 6. Sincronización Pipedrive
```sql
-- Mapeo de IDs entre SPARK y Pipedrive
CREATE TABLE IF NOT EXISTS pipedrive_id_map (
  id SERIAL PRIMARY KEY,
  entidad TEXT NOT NULL,            -- 'cotizacion', 'cliente', 'actividad', 'reservacion'
  spark_id INTEGER NOT NULL,
  pipedrive_id INTEGER NOT NULL,
  pipedrive_type TEXT NOT NULL,     -- 'deal', 'person', 'organization', 'activity'
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  sync_direction TEXT DEFAULT 'spark_to_pipedrive',
  UNIQUE(entidad, spark_id),
  UNIQUE(pipedrive_type, pipedrive_id)
);

-- Log de sincronizaciones
CREATE TABLE IF NOT EXISTS pipedrive_sync_log (
  id SERIAL PRIMARY KEY,
  entidad TEXT NOT NULL,
  spark_id INTEGER,
  pipedrive_id INTEGER,
  direction TEXT NOT NULL,          -- 'spark_to_pipedrive' | 'pipedrive_to_spark'
  action TEXT NOT NULL,             -- 'create' | 'update' | 'error'
  payload JSONB,                    -- Datos enviados/recibidos
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_created ON pipedrive_sync_log(created_at DESC);
```

#### 7. Huella digital del cliente (deduplicación)
```sql
-- Índices únicos para prevenir duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email_unique
  ON clientes(LOWER(email)) WHERE email IS NOT NULL AND email != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_telefono_unique
  ON clientes(telefono) WHERE telefono IS NOT NULL AND telefono != '';

-- Tabla de merge (cuando se detectan duplicados retroactivos)
CREATE TABLE IF NOT EXISTS clientes_merge_log (
  id SERIAL PRIMARY KEY,
  cliente_principal_id INTEGER NOT NULL REFERENCES clientes(id),
  cliente_duplicado_id INTEGER NOT NULL REFERENCES clientes(id),
  merged_by INTEGER REFERENCES usuarios(id),
  merged_at TIMESTAMPTZ DEFAULT NOW(),
  datos_preservados JSONB          -- Backup del duplicado antes de merge
);
```

#### 8. Mejoras en cotizaciones (pricing actualizado)
```sql
-- Campos de pricing detallado
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS renta_salon DECIMAL(12,2) DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS costo_ab DECIMAL(12,2) DEFAULT 0;         -- A&B total
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS ab_reemplaza_renta BOOLEAN DEFAULT FALSE;  -- TRUE si A&B >= renta
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS servicios_adicionales DECIMAL(12,2) DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS porcentaje_descuento DECIMAL(5,2) DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS descuento_autorizado BOOLEAN DEFAULT FALSE;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS autorizado_por INTEGER REFERENCES usuarios(id);

-- Campo para tipo de pipeline (mapea a Pipedrive)
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS tipo_pipeline TEXT
  CHECK (tipo_pipeline IN ('banquete_social', 'banquete_comercial', 'grupo_social', 'grupo_comercial', 'tripulacion', 'reserva_individual'));

-- Campo para número de personas (invitados)
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS num_personas INTEGER DEFAULT 0;
```

#### 9. Notificaciones internas
```sql
CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  tipo TEXT NOT NULL,               -- 'empalme', 'descuento', 'bloqueo', 'sync_error', 'vencimiento'
  titulo TEXT NOT NULL,
  mensaje TEXT,
  referencia_tipo TEXT,             -- 'cotizacion', 'reservacion', 'autorizacion'
  referencia_id INTEGER,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida, created_at DESC);
```

#### 10. Configuración de umbrales de descuento
```sql
-- Usar tabla configuraciones existente con clave específica
INSERT INTO configuraciones (clave, hotelid)
  SELECT 'descuento_max_gerente', NULL
  WHERE NOT EXISTS (SELECT 1 FROM configuraciones WHERE clave = 'descuento_max_gerente');

INSERT INTO configuraciones (clave, hotelid)
  SELECT 'descuento_max_director', NULL
  WHERE NOT EXISTS (SELECT 1 FROM configuraciones WHERE clave = 'descuento_max_director');

-- Los valores se configuran desde la UI (Configuraciones → General)
-- Ejemplo: descuento_max_gerente = 15, descuento_max_director = 50
```

#### RLS para tablas nuevas
```sql
-- Habilitar RLS en todas las tablas nuevas
ALTER TABLE salones_composicion ENABLE ROW LEVEL SECURITY;
ALTER TABLE empalmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE autorizaciones_descuento ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipedrive_id_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipedrive_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_merge_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos_rol ENABLE ROW LEVEL SECURITY;

-- Policy: service_role tiene acceso total (SPARK usa service_role_key)
-- Crear policy similar a las existentes en security-rls.sql
```

> **Resumen de tablas nuevas:** 7 tablas + columnas en 3 tablas existentes
> **Archivo destino:** `scripts/MIGRATION-V2.sql` (crear nuevo, NO modificar MIGRATION-FINAL.sql)

---

## 7. VARIABLES DE ENTORNO

### Minimo para funcionar
| Variable | Tipo | Descripcion |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL Supabase (`https://yfisrqlhnlryramfdtwy.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Service role key (usada en TODOS los server actions) |
| `ENCRYPTION_KEY` | Secret | Clave AES para encriptar sesiones |

### Funcionalidad completa
| Variable | Tipo | Descripcion |
|----------|------|-------------|
| `CRON_SECRET` | Secret | Protege endpoint `/api/cron/liberar-fechas` |
| `SMTP_HOST` | Plain | Host SMTP (default: smtp.gmail.com) |
| `SMTP_PORT` | Plain | Puerto SMTP (default: 587) |
| `SMTP_USER` | Secret | Email remitente SMTP |
| `SMTP_PASS` | Secret | Password/App Password SMTP |
| `NEXT_PUBLIC_APP_URL` | Public | URL base para links en emails |

### Integración Pipedrive
| Variable | Tipo | Valor actual | Descripcion |
|----------|------|-------------|-------------|
| `PIPEDRIVE_API_TOKEN` | Secret | `7f494ce1e361b078a80d044694340c9a85749f53` | Token de API Pipedrive (company MileniuM ID:273759) |
| `PIPEDRIVE_BASE_URL` | Plain | `https://api.pipedrive.com/v1` | URL base de la API REST v1 |
| `PIPEDRIVE_COMPANY_ID` | Plain | `273759` | ID de la compañía MileniuM Grupo Hotelero |
| `PIPEDRIVE_WEBHOOK_SECRET` | Secret | (por generar) | Secret para validar webhooks entrantes de Pipedrive |

### Solo desarrollo
| Variable | Tipo | Descripcion |
|----------|------|-------------|
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Public | Redirect URL para auth en dev |

> **Advertencia Vercel:** Si subes env vars desde `.env.local` que tiene valores con comillas (`"https://..."`), Vercel los guarda como `""https://...""`. Siempre strip quotes antes de subir.

---

## 8. USUARIOS DEL SISTEMA

| # | Usuario | Rol | Email | Password |
|---|---------|-----|-------|----------|
| 1 | ArkamiaTI | admin_principal | arkamia.ti.ia@gmail.com | Arkamia2026. |
| 2 | Omar Coronel | Vendedor | omar.coronel@hotelesmilenium.com | (hash bcrypt) |
| 3 | Ruben Jasso | Vendedor Full | ruben.jasso@siembi.com | (hash bcrypt) |
| 4 | David Adorno | Admin General | david.adorno@arkamia.com.mx | (hash bcrypt) |

---

## 9. MODULOS COMPLETADOS (17+)

### 1. Dashboard (mejorado 2026-03-17)
- KPIs de ventas (cotizaciones, reservaciones, revenue)
- Calendario interactivo con eventos
- Eventos proximos
- **Nuevos colores y visual mejorado**
- **Filtros de salones**
- **Disponibilidad combinada** (salones + cotizaciones + reservaciones)

### 1b. Login (rediseñado 2026-03-17)
- Titulo: "Bienvenido a SPARK"
- Subtitulo con info del portal
- Imagen spark-black.svg centrada
- Soporte dark mode con SVGs adaptivos

### 2. Salones
- 128 salones de 14 hoteles
- 835 montajes (teatro, banquete, coctel, etc.)
- Galeria de fotos por salon
- Landing visual fullscreen para presentaciones presenciales

### 3. Cotizaciones (mejorado significativamente)
- **Wizard multi-paso:** Hotel → Fecha → Cliente → Evento → Elementos → Pricing → Revision
- Folio automatico: `{ACRONIMO}-{TIPO}-{CONSECUTIVO}` (ej. CPMTY-B-15)
- Calculo automatico: salon + (menu x PAX) + extras - descuento + IVA 16%
- Verificacion de disponibilidad combinada (contra cotizaciones Y reservaciones)
- Flujo de estatus: Borrador → Enviada → Confirmada → Reservada → Cancelada → Vencida
- **Sistema de elementos:** Cotizaciones ahora tienen elementos flexibles via `elementosxcotizacion`
  - Asignar paquete completo (copia elementos del paquete)
  - Agregar/eliminar elementos individuales
  - Tipos: Lugar, Alimento, Bebidas, Cortesias, Servicio, Mobiliario, Audiovisual, Complemento
- **Filtros en lista de cotizaciones** (quotations-filter.tsx)
- **Modal detalle cotizacion** (quotation-detail-modal.tsx)
- **Editor de cotizacion mejorado** (quotation-editor.tsx)
- **Fix race condition (2026-03-17):** pendingTipoEventoId/pendingMontajeId/pendingSalonId para Radix Select

### 4. Reservaciones
- CRUD completo
- Vinculacion con cotizacion
- Tipo de evento

### 5. Clientes
- CRUD + busqueda
- Vista 360 en CRM

### 6. PDF + Email
- PDF profesional con jsPDF (branding SPARK)
- Envio por SMTP (nodemailer)
- Templates de email rebrandeados (SPARK, no "Portal Milenium")
- Recordatorios programados

### 7. Pagos
- Upload de comprobantes (drag & drop, max 5 archivos, 10MB c/u)
- Storage en Supabase: `pagos/{cotizacionId}/{filename}`
- Metadata en campo `comprobantespago` (jsonb)
- Regla de prioridad: primer pago confirmado gana
- Deteccion de conflictos

### 8. CRM Completo
- **Dashboard:** Metricas de pipeline, actividad reciente
- **Pipeline Kanban:** 10 etapas arrastrables
- **Cliente 360:** Historial completo por cliente
- **Actividades:** Log de llamadas, emails, reuniones
- **Command Palette:** Busqueda global con Cmd+K

### 9. Habitaciones
- CRUD + categorias de habitacion
- 16 amenidades predefinidas
- Filtros por hotel y categoria

### 10. Menus
- Categorias (8 predefinidas) + items individuales
- Alergenos, precios en MXN
- Vinculacion con cotizaciones

### 11. Paquetes (expandido significativamente)
- CRUD completo con 9 funciones en paquetes.ts
- **Tipos expandidos:** Boda, Corporativo, Social, XV Años, Graduacion, Convencion, Coctel, Otro
- **tipoPaquete:** Simple o Completo (define subsecciones de platillos)
  - **Completo:** Subsecciones Entradas / Plato Fuerte / Postres
  - **Simple:** Seccion unica de platillos
- Vigencia (fecha inicio/fin)
- Lista de servicios incluidos (campo `incluye` JSON)
- **Sistema de elementos:** Paquete define elementos default en `elementosxpaquete`
- Al asignar a cotizacion, elementos se copian a `elementosxcotizacion`
- Grid view con filtros + table view
- Toggle activo/inactivo (soft delete)
- Color mapping por tipo (TIPO_PAQUETE_CONFIG)

### 15. Complementos (NUEVO)
- Catalogo de complementos por hotel
- Campos: nombre, descripcion, costo, cantidad, unidad, hotelid, activo, imgurl
- **Preview PDF/imagen en modal** al seleccionar (iframe con navpanes=0)
- Modal ampliado (max-w-2xl) con scroll para PDFs
- Se asignan como elementos tipo "Complemento" a cotizaciones

### 16. Cortesias (NUEVO)
- Tipo canonico mapping: "cortesia"/"cortesias" → "Cortesias" (plural)
- Tabla separada en BD
- Se manejan como elementos tipo "Cortesias" en cotizaciones
- TIPO_A_SECCION: cortesias → "cortesias" para normalizarSeccion

### 17. Platillos Items (NUEVO)
- Items individuales de platillos con campos: nombre, descripcion, costo, horas, hotelid, tipo, documentopdf
- Busqueda filtrada por tipo de paquete (Simple/Completo)
- Funcion `buscarPlatillosItems()` filtra por tipo
- `obtenerPlatillosCotizacion()` incluye campo tipo

### 12. Convenios
- CRUD con mapeo ingles/espanol
- Renovacion con versionado (convenio padre → hijo)
- Auto-vencimiento por fecha
- Tipos de descuento: porcentaje o monto fijo

### 13. Configuraciones
- **Usuarios:** CRUD con password bcrypt
- **Hoteles:** Gestion de la cadena
- **General:** IVA, moneda, parametros globales
- **Preferencias:** Configuracion por usuario

### 14. Seguridad
- RLS policies en tablas sensibles (ya aplicado)
- Security headers en middleware: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- CRON_SECRET para proteger endpoints cron
- Middleware Edge Runtime (valida cookie, protege rutas)
- Hardcoded credentials eliminadas
- `ignoreBuildErrors: false` (0 errores TypeScript)

---

## 10. CRON JOBS

| Endpoint | Schedule | Funcion |
|----------|----------|---------|
| `/api/cron/liberar-fechas` | Daily 6:00 UTC | Busca cotizaciones vencidas y cambia estatus a "Vencida", liberando las fechas |

Configurado en `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/liberar-fechas",
    "schedule": "0 6 * * *"
  }]
}
```

---

## 11. HISTORIAL DE COMMITS

### Fases originales (desarrollo David + Claude Code)
| # | Hash | Descripcion | Archivos | LOC |
|---|------|-------------|----------|-----|
| 1 | `50af79d` | Fase 0: Seguridad critica + Setup | ~20 | +500 |
| 2 | `57719a6` | Branding SPARK + Fase 1 migracion datos | ~30 | +800 |
| 3 | `0f148c3` | Fases 2-4: Material + Calendario + Cotizaciones | ~25 | +2,000 |
| 4 | `911cfb6` | Fase 5: PDF + Email + Recordatorios | ~15 | +1,500 |
| 5 | `0d97a51` | UX/UI Overhaul (dark mode, semantic colors) | 32 | +1,362 -583 |
| 6 | `db98c68` | Fases 6+7: Pagos + CRM Completo | 20 | +5,081 |
| 7 | `72bc9e4` | Fases 8-12: Catalogos (5 modulos) | 50 | +10,001 |
| 8 | `6b06987` | Fase 13: Polish + Security + Deploy | 34 | +1,030 |
| 9 | `e9dd657` | Fix: Server actions para esquema real BD | 3 | +200 |

### Desarrollo continuo (Ruben Jasso + Claude Opus 4.6, via GitHub)
| Hash | Fecha | Descripcion |
|------|-------|-------------|
| `c849935` | 2026-03-16 | fix: cortesias como "Cortesias" en BD + PDF en complementos |
| `ece79ef` | 2026-03-16 | feat: mostrar PDF al seleccionar complemento en modal |
| `7887b8b` | 2026-03-16 | fix: complementos usa imgurl en vez de documentopdf |
| `a4026af` | 2026-03-16 | fix: complementos muestra PDF con iframe (igual que Alimentos) |
| `4d419ac` | 2026-03-16 | wip: complemento asignado usa imgurl para PDF iframe |
| `f46166f` | 2026-03-17 | feat: dashboard colors, salon filters, disponibilidad combinada |
| `4a88657` | 2026-03-17 | wip: pause work — session state saved |
| `88a0340` | 2026-03-17 | feat: tipoPaquete Simple/Completo, login redesign, dark SVGs, command palette |
| `bb935c9` | 2026-03-17 | fix: imports rotos @/types + modal paquete preview state |
| `639f47c` | 2026-03-17 | fix: race condition Radix Select — salon/montaje/tipoEvento en edicion |

> **Nota:** Ruben Jasso (ruben.jasso@milenium.com) esta haciendo desarrollo activo
> con Claude Opus 4.6 como copiloto. Ambos branches (main + RubenBranch) despliegan automaticamente.

---

## 12. DECISIONES DE ARQUITECTURA

| # | Decision | Razon |
|---|----------|-------|
| D1 | Auth custom (bcrypt+AES) en vez de Supabase Auth | Ya funciona, 4 usuarios activos, no vale migrar |
| D2 | SQL scripts en /scripts/ son obsoletos | Tablas de v0 usan ingles, BD real usa espanol |
| D3 | Migrar cargasalones → salones | 128 salones, 835 montajes normalizados |
| D4 | PDF + Email para cotizaciones | Entregable principal del vendedor |
| D5 | Desarrollo en Claude Code (no v0) | Mayor control, TypeScript strict, testing |
| D6 | Seguridad = prioridad ALTA | RLS, headers, credentials removidas |
| D7 | Activar TODOS los modulos vacios | Habitaciones, menus, paquetes, convenios, config |
| D8 | Metodologia BI-BIM-BAP | Sin GSD. Tracking via memory + commits |
| D9-D12 | Agentes paralelos + branding lime-600 | Hasta 5 agentes simultaneos, sidebar dark |
| D13 | CRM es sistema completo | Dashboard + Kanban + 360 + Actividades + Cmd+K |
| D14-D15 | Ejecucion paralela de fases | Fases 2-4, 6-7, 8-12 ejecutadas en paralelo |
| D16 | Email via Outlook del usuario | ON STANDBY — requiere registro en Azure Portal |
| D17 | ~~Deploy como "sparkmilenium"~~ **REVERTIDO:** Ahora `v0-portal-comercial-and-banquetes` es produccion | GitHub auto-deploy habilitado, sparkmilenium ya no se usa |
| D18 | Convenios: columnas ingles + vista espanol | No romper lo existente, view mapea para reads |
| D19 | Configuraciones: campo `clave` + `hotelid` | ALTER TABLE sobre tabla existente |
| D20 | Arquitectura de elementos flexible | Cotizaciones y paquetes usan elementosxcotizacion/elementosxpaquete con tipoelemento |
| D21 | tipoPaquete Simple/Completo | Controla subsecciones de platillos (3 secciones vs 1) |
| D22 | Complementos con imgurl + PDF iframe | Preview inline en modales, mismo patron que Alimentos |
| D23 | GitHub + auto-deploy | Repo publico adornodavid/SPARK, push → Vercel deploy automatico |
| D24 | Dos branches: main + RubenBranch | Ambos despliegan, desarrollo paralelo |

---

## 13. SEGURIDAD APLICADA

### Fixes criticos realizados (Fase 0)
1. `encryption.ts` — Eliminado fallback key hardcodeado
2. `session.ts` — Fix `Id` → `id` (sesion siempre undefined)
3. `session.ts` — Parsing con `indexOf(":")` en vez de `split(":")` (emails con ":" rompian)
4. `auth.ts` — Input sanitizado para filtro `.or()` (prevencion PostgREST injection)
5. `auth.ts` — SELECT de campos especificos (no `select("*")`)

### Seguridad en produccion
- RLS policies activas en tablas sensibles (`scripts/security-rls.sql`)
- Security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- CRON_SECRET protege endpoint cron
- Hardcoded credentials eliminadas del codigo
- Cookie: HttpOnly, Secure, SameSite=Lax
- Service role key solo en env vars de Vercel (no en codigo)

### Pendiente de seguridad
- Zero test files (sin testing automatizado)
- Sin rate limiting en login
- Sin validacion Zod en server actions (Zod instalado pero no usado)
- Sin CI/CD pipeline

---

## 14. PROBLEMAS CONOCIDOS Y GOTCHAS

### DB Schema Mismatch (ingles vs espanol)
- Tablas creadas por v0 usan nombres en INGLES
- Codigo SPARK usa ESPANOL
- **Solucion:** VIEWs para mapear + server actions escriben en ingles
- **Siempre verificar** `information_schema.columns` antes de crear migrations

### hoteles PK
- PK real es `id` (integer), **NO** `hotelid`
- Vista `vw_ohoteles` renombra `id` → `hotelid`
- Server actions: `.eq("hotelid", x)` en VISTA, `.eq("id", x)` en TABLA

### CREATE TABLE IF NOT EXISTS
- **No falla** si tabla existe con columnas diferentes
- Los INDEX y VIEW subsecuentes SI fallan en columnas inexistentes
- Solucion: usar ALTER TABLE + verificar information_schema

### CREATE OR REPLACE VIEW
- **No puede renombrar** columnas existentes de una vista
- Solucion: `DROP VIEW IF EXISTS` primero, luego `CREATE VIEW`

### Vercel env vars con comillas
- `.env.local` con valores entre comillas se suben como `""value""`
- Siempre strip quotes: `value="${value%\"}"; value="${value#\"}"`

### Next.js 16 deprecation warning
- `middleware.ts` genera warning de deprecacion (proxy convention)
- No es bloqueante, funciona correctamente

---

## 15. DATOS EN PRODUCCION

| Entidad | Cantidad | Notas |
|---------|----------|-------|
| Hoteles | 15 | Cadena MGHM completa |
| Salones | 128 | 14 hoteles (TRAVO no tiene salones) |
| Montajes | 835 | Teatro, banquete, coctel, etc. |
| Usuarios | 4 | 1 admin principal, 2 vendedores, 1 admin general |
| Cotizaciones | 3 | Test data |
| Menu categorias | 8 | Seed data aplicado |
| Platillos items | — | Items con tipo, costo, PDF |
| Complementos | — | Por hotel, con imgurl |
| Cortesias | — | Como tipo de elemento |
| Elementos x paquete | — | Relacion paquete → elementos |
| Elementos x cotizacion | — | Relacion cotizacion → elementos |

### Hotel sin salones
- **TRAVO** (hotel id=10) — Confirmado que NO tiene salones de eventos

---

## 16. PENDIENTES (BACKLOG)

### ALTA PRIORIDAD (Post-Taller 2026-03-17)
| # | Item | Sección ref | Estado |
|---|------|-------------|--------|
| P1 | Integración Pipedrive bidireccional | §19, §25.2 | No iniciado |
| P2 | Salones compuestos (bloqueo cruzado) | §21, §25.3 | No iniciado |
| P3 | Sistema de horas extra en cotización | §21, §25.4 | No iniciado |
| P4 | Roles granulares (5 niveles) | §23, §25.5 | No iniciado |
| P5 | Flujo de empalme y alertas | §22, §25.6 | No iniciado |
| P6 | Descuentos con autorización | §22, §25.7 | No iniciado |
| P7 | Validación Zod en server actions | §25.1 | No iniciado |
| P8 | Pricing actualizado (A&B reemplaza renta) | §20, BD §8 | No iniciado |

### MEDIA PRIORIDAD
| # | Item | Estado |
|---|------|--------|
| M1 | Huella digital cliente (dedup por tel/email) | No iniciado |
| M2 | Notificaciones internas (Supabase Realtime) | No iniciado |
| M3 | Reportes gerenciales funcionales | Parcial |
| M4 | Montaje/desmontaje en calendario (ventana 10hrs) | No iniciado |
| M5 | Testing automatizado (Vitest + Playwright) | No iniciado |
| M6 | Optimización tablet/iPad | No iniciado |

### BAJA PRIORIDAD
| # | Item | Estado |
|---|------|--------|
| B1 | D16: Outlook Integration | ON STANDBY |
| B2 | CI/CD pipeline (.github/workflows) | No iniciado |
| B3 | Rate limiting en login | No iniciado |
| B4 | Seed data menu_items | Parcial |

> **Orden de ejecución sugerido:** P2 → P8 → P3 → P5 → P6 → P4 → P1 → P7
> (Salones compuestos primero porque afecta toda la lógica de disponibilidad)

---

## 17. COMO LEVANTAR EL PROYECTO

### Requisitos
- Node.js 18+
- pnpm

### Pasos
```bash
# 1. Clonar/copiar proyecto
cd /path/to/SPARK

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Llenar las variables segun seccion 7 de este documento

# 4. Ejecutar migrations (si BD nueva)
# Ejecutar scripts/MIGRATION-FINAL.sql en Supabase SQL Editor
# Ejecutar scripts/security-rls.sql en Supabase SQL Editor

# 5. Desarrollo local
pnpm dev

# 6. Build de produccion
pnpm build  # Debe dar 0 errores TypeScript
```

### Deploy a Vercel (automatico via GitHub)
```bash
# El deploy es AUTOMATICO: push a main o RubenBranch → Vercel despliega
git push origin main          # Despliega a produccion
git push origin RubenBranch   # Despliega preview

# Manual (si necesario):
vercel link  # Vincular al proyecto v0-portal-comercial-and-banquetes
vercel --prod
```

---

## 18. CONTEXTO PARA CLAUDE CODE

Si inicias una conversacion nueva con Claude Code sobre este proyecto:

1. **Lee este archivo primero** — contiene toda la especificacion
2. **Memory path:** `~/.claude/memory/projects/spark-comercial/` (context, decisions, todos)
3. **Repo GitHub:** `https://github.com/adornodavid/SPARK` (clonar para desarrollo)
4. **Docs path:** `/Volumes/G-DRIVE slim/Proyectos Claude Code/Desarrollos Empresariales/SPARK/`
4. **MIGRATION-FINAL.sql** es el unico script SQL valido — los demas son obsoletos
5. **Convenios escribe en ingles, lee en espanol** — ver seccion 6
6. **hoteles PK es `id`**, no `hotelid` — ver seccion 14

### Archivos de referencia adicionales (en raiz del proyecto)
- `SPARK-BI-BIM-BAP-ANALISIS.md` — Analisis completo de BI original (60K chars, ya obsoleto en gran parte)
- `ANALISIS-QA.md` — Auditoria QA pre-build (muchos issues ya resueltos)
- `ANALISIS-UX-UI.md` — Auditoria UX/UI pre-build (muchos issues ya resueltos)
- `scripts/env-checklist.md` — Detalle de variables de entorno y archivos que las usan

> **NOTA:** Los analisis QA y UX/UI fueron generados ANTES de las fases 0-13. Muchos de los issues listados ya fueron resueltos (TypeScript errors, dark mode, semantic colors, error pages, console.logs, security fixes). Consultarlos solo como referencia historica.

---

## 19. INTEGRACIÓN PIPEDRIVE CRM

### Acceso API
| Campo | Valor |
|-------|-------|
| API Token | `7f494ce1e361b078a80d044694340c9a85749f53` |
| Base URL | `https://api.pipedrive.com/v1/` |
| Auth | Query param `?api_token={token}` |
| Company | MileniuM Grupo Hotelero Mexicano (ID: 273759) |
| Usuarios activos | 83 |
| Usuarios inactivos | 34 |
| Admins | 6 |
| Pipelines | 97 activos |

### Estructura de Pipelines (por hotel × tipo)
Cada hotel tiene hasta 6 pipelines con el patron: `{HOTEL} - {TIPO}`

**Tipos de pipeline:**
- Banquetes Social
- Banquetes Comercial
- Grupos Comercial
- Grupos Social
- Tripulacion
- Chatbot Reserva Individual

**Ejemplo: CPMTY tiene:**
- CPMTY - Banquetes Social (pipeline_id varía)
- CPMTY - Banquetes Comercial
- CPMTY - Grupos Comercial
- CPMTY - Grupos Social
- etc.

### Stages (Etapas del pipeline)
Progresion lineal identica en todos los pipelines:
```
PROSPECTAR → COTIZAR → WEAK → SEGUIMIENTO → ANTICIPO → CIERRE
```

**Significado de cada stage:**
| Stage | Significado | Accion en SPARK |
|-------|-------------|-----------------|
| PROSPECTAR | Lead nuevo, primer contacto | Crear deal, asignar asesor |
| COTIZAR | Se genera cotizacion formal | Generar cotizacion en SPARK, sync a Pipedrive |
| WEAK | Cotizacion enviada sin respuesta | Alerta de seguimiento |
| SEGUIMIENTO | Asesor dando seguimiento activo | Log de actividades |
| ANTICIPO | Cliente dio anticipo parcial | Registrar pago en SPARK |
| CIERRE | Evento confirmado y pagado | Reservacion confirmada, bloqueo definitivo |

### Campos Custom de Deal (Pipedrive)

#### TIPOS DE EVENTO (key: `743bd1d02726c3dd03e1c5eacdc68c171ad52e4b`)
31 opciones:
```
ALBERCADA, BAUTIZO, BODA, BRIDAL SHOWER, BRUNCH, CENA, COCTEL,
COMIDA, CONFERENCIA, CONGRESO, CONVENCION, CUMPLEAÑOS, DESAYUNO,
DESPEDIDA DE SOLTERO (A), EVENTO CORPORATIVO, EVENTO CULTURAL,
EXPOSICION, FIESTA INFANTIL, FIESTA TEMATICA, GRADUACION,
LANZAMIENTO, POSADA, PRESENTACIÓN, QUINCE AÑOS, REUNION,
SEMINARIO, SESION DE FOTOS, SHOWROOM, TALLER, TEAM BUILDING,
WELCOME DINNER
```

#### HOTEL (key: `6cdbb3c3aced6c4b4b78e0b73a2e6db4c2bbb3ce`)
16 opciones:
```
CPMTY (Crowne Plaza Monterrey)
CPSLP (Crowne Plaza San Luis Potosí)
HI AE (Holiday Inn Aeropuerto)
HI EP (Holiday Inn Express Puebla)
HI GDL (Holiday Inn Guadalajara)
HI LS (Holiday Inn La Sierra?)
HI PE (Holiday Inn Parque Ecológico)
HIEX CS (Holiday Inn Express Ciudad del Saber)
HIPF (Holiday Inn Parque Fundidora)
HL MTY (Hotel Lux Monterrey?)
MS CIELO (MS Cielo)
MS MILENIUM (MS Milenium)
STAYBRIDGE (Staybridge Suites)
TRAVO (Travo by Milenium)
WGATE (Wingate)
```

#### ESTRATEGIA DE VENTA (key: `e4ce77d5e1aa5bb77ec0e296f7d5c5ceb64a8d7e`)
37 opciones (CENAS DE GALA, COLOCACION DE MARCA, CONVENIO, FIDELIZACION, PROSPECCIÓN EN FRIO, REFERIDO, SOCIAL MEDIA, WALKIN, etc.)

#### MEDIO POR EL QUE SE OBTIENE EL NEGOCIO (key: `c3e17a1c2c3bd5aaf549e06d01dfa0e7d28ae6e3`)
39 opciones (BOOKING, CORREO ELECTRONICO, EXPEDIA, FACEBOOK, INSTAGRAM, LLAMADA, REFERIDO, WHATSAPP, etc.)

#### Etiquetas (Labels)
| Label | ID |
|-------|-----|
| Banquete Social | 1587 |
| Grupo Social | 1588 |
| Banquetes Comercial | 2296 |
| Grupo Comercial | 2297 |
| Tripulacion | 2298 |
| Cotización | 2299 |
| Cortesia | 2300 |
| Chatbot Reserva Individual | 2301 |
| Grupal | 2302 |
| Wedding Planner | 2303 |
| Renovación de contrato | 2304 |
| Convenio | 2305 |
| Government | 2306 |
| Tour and Travel | 2307 |

#### Otros campos importantes
| Campo | Key | Tipo |
|-------|-----|------|
| N° de personas (invitados) | `f5cb3cb1bfad59a3f6b0f96b75ba34be4b85bb44` | double |
| Fecha del evento/Grupo | `0c7c4a93d0e47f00e3c5e4a66bbca6c3d3a1d62d` | daterange |
| Horario del Negocio | `d5b03a8c7fe7db6c6b741f1bb68bb78ef0d8e43f` | timerange |
| Ingresos A&B banquetes | `e40d21e8b35a2a51e3a3ef20fcc0ff0b93f19a3c` | monetary |
| Estimado Cuartos Noche | `5e7f0f26e226aca9a8f3b3ef6ce06d7dfc8ba5b8` | double |
| Ejecutivo que prospecta | `a2be7a7a8e9b8bf0fa2b6a5e7b0b7a8c2e1b3d5f` | user |
| Ejecutivo que cotiza | `b3cf8b8b9f0c9cf1fb3c7b6f8c1c8b9d3f2c4e6g` | user |
| Fecha de Cierre Negocio | `c4dg9c9c0g1d0dg2gc4d8c7g9d2d9c0e4g3d5f7h` | date |

### Sincronización Bidireccional SPARK ↔ Pipedrive

**Principio:** SPARK es la interfaz principal de trabajo. Pipedrive es el CRM de respaldo y reporteo gerencial.

**Entidades a sincronizar:**
| Entidad SPARK | Entidad Pipedrive | Dirección |
|---------------|-------------------|-----------|
| Cotizaciones | Deals | Bidireccional |
| Clientes | Persons + Organizations | Bidireccional |
| Actividades CRM | Activities | Bidireccional |
| Notas | Notes | SPARK → Pipedrive |
| Archivos (PDF, comprobantes) | Files | SPARK → Pipedrive |
| Stage del deal | Pipeline stage | Bidireccional |

**Mapeo de estatus SPARK → Pipedrive stage:**
| Estatus SPARK | Stage Pipedrive |
|---------------|----------------|
| Borrador | PROSPECTAR |
| Enviada | COTIZAR |
| Sin respuesta (>3 días) | WEAK |
| En seguimiento | SEGUIMIENTO |
| Pago parcial | ANTICIPO |
| Confirmada/Reservada | CIERRE |
| Cancelada/Vencida | Deal lost |

**Reglas de sync:**
1. Al crear cotización en SPARK → crear/actualizar Deal en Pipedrive con campos custom mapeados
2. Al cambiar stage en Pipedrive → actualizar estatus en SPARK
3. Al agregar actividad en cualquier sistema → replicar en el otro
4. Archivos PDF y comprobantes → push a Pipedrive Files
5. **NUNCA borrar** desde SPARK — solo crear, leer y actualizar
6. Todos los pipelines deben sincronizar (no solo banquetes)

### Implementación técnica recomendada
```
app/actions/pipedrive.ts       — Client API (GET/POST/PUT, NUNCA DELETE)
app/actions/pipedrive-sync.ts  — Lógica de sincronización bidireccional
app/api/webhooks/pipedrive/    — Webhook receiver para cambios en Pipedrive
lib/pipedrive/client.ts        — HTTP client con token auth
lib/pipedrive/field-mapping.ts — Mapeo de campos SPARK ↔ Pipedrive custom fields
```

---

## 20. LÓGICA DE PRECIOS Y FACTURACIÓN

### Regla fundamental
> **El precio mínimo de un evento = costo de renta del salón.**
> Alimentos y Bebidas (A&B) pueden reemplazar la renta, pero NUNCA reducir el ingreso total por debajo del costo del salón.

### Cálculo paso a paso

```
1. BASE = Renta del salón (costo fijo por reservar el espacio)

2. A&B = (precio_platillo × número_personas)
   Si A&B >= BASE:
     → A&B REEMPLAZA la renta (no se suman)
     → Total base = A&B
   Si A&B < BASE:
     → Se cobra SOLO la renta del salón
     → Total base = BASE

3. SERVICIOS ADICIONALES (siempre se suman al total):
   - Complementos (audiovisual, decoración, etc.)
   - Cortesías (solo si tienen costo, normalmente son gratis)
   - Mobiliario extra
   - Horas extra (ver sección 21)

4. SUBTOTAL = Total base + Servicios adicionales

5. DESCUENTOS:
   - Requieren autorización según monto (ver sección 22)
   - Se aplican sobre subtotal

6. IVA = 16% sobre (SUBTOTAL - DESCUENTO)

7. TOTAL = (SUBTOTAL - DESCUENTO) + IVA
```

### Ejemplo práctico
```
Salón Acero: renta $50,000
Menú por persona: $800 × 150 personas = $120,000
→ A&B ($120K) > Renta ($50K) → se cobra A&B = $120,000

+ Audiovisual: $15,000
+ DJ: $8,000
+ 2 horas extra: ($50,000/8) × 2 = $12,500

Subtotal: $120,000 + $15,000 + $8,000 + $12,500 = $155,500
Descuento gerente: 5% = -$7,775
Base: $147,725
IVA 16%: $23,636
TOTAL: $171,361
```

### Montaje y precios
- **El tipo de montaje NO afecta el precio** — es solo la disposición física del mobiliario
- Montaje es dato informativo (teatro, banquete, cóctel, escuela, herradura, etc.)
- El equipo compartirá detalle de montajes por salón y costos asociados (pendiente)

---

## 21. LÓGICA DE TIEMPO Y DISPONIBILIDAD

### Duración estándar de evento
```
Tiempo incluido en renta del salón:
  - Evento:     8 horas (tiempo del cliente)
  - Montaje:    1 hora antes (preparación del espacio)
  - Desmontaje: 1 hora después (limpieza)
  - TOTAL:     10 horas de ocupación real del salón
```

### Horas extra
```
Costo por hora extra = Renta del salón / 8

Ejemplo:
  Salón con renta $50,000
  Hora extra = $50,000 / 8 = $6,250 por hora adicional
```

- Las horas extra se suman SIEMPRE como servicio adicional
- Se cobran por cada hora adicional sobre las 8 del evento
- Montaje y desmontaje NO generan cargos extra

### Salones compuestos (divisibles)
Algunos salones son divisibles y pueden usarse como uno grande o varios pequeños.

**Regla de bloqueo:**
```
Salón compuesto: "Acero" = A01 + A02

Caso 1: Se reserva "Acero" completo
  → Bloquea: Acero, A01, A02 (los 3 quedan no-disponibles)

Caso 2: Se reserva solo "A01"
  → Bloquea: A01 y "Acero" (ya no se puede usar el compuesto)
  → A02 sigue disponible

Caso 3: Se reservan A01 y A02 por separado (eventos distintos)
  → Bloquea: A01, A02, y Acero
```

**Implementación en BD:**
- Tabla `salones` necesita campo `salon_compuesto_id` (FK a sí misma) o tabla `salones_composicion`
- Query de disponibilidad debe verificar: el salón solicitado + sus componentes + el salón compuesto padre

### Verificación de disponibilidad
El sistema actual ya verifica contra cotizaciones Y reservaciones. Se debe expandir para:
1. Verificar componentes de salones compuestos
2. Considerar montaje/desmontaje en la ventana de tiempo (10 hrs, no 8)
3. Permitir cotizaciones simultáneas como alertas (no hard blocks)
4. Solo reservaciones confirmadas son hard blocks

---

## 22. CONFLICTOS, AUTORIZACIONES Y EMPALMES

### Tipos de bloqueo
| Tipo | Descripción | ¿Bloquea? |
|------|-------------|-----------|
| Cotización enviada | Otro asesor cotizó el mismo salón/fecha | **Alerta** (no hard block) |
| Reservación confirmada | Evento pagado y confirmado | **Hard block** (definitivo) |
| Bloqueo gerencial | Gerente autorizó bloqueo temporal | **Soft block** (con override del gerente) |

### Flujo de empalme (2 cotizaciones, mismo salón/fecha)
```
1. Asesor A cotiza Salón X para fecha Y → Cotización se guarda normalmente
2. Asesor B intenta cotizar Salón X para fecha Y:
   → SPARK muestra ALERTA: "Existe cotización previa del Asesor A"
   → Asesor B PUEDE cotizar (no es bloqueo duro)
   → Ambas cotizaciones coexisten como competencia
3. Primer asesor en confirmar ANTICIPO → gana prioridad
4. El otro asesor:
   → Se le notifica que debe cambiar de fecha
   → Su cotización pasa a estado "Empalme"
5. Si ninguno confirma anticipo:
   → Gerente decide quién tiene prioridad
   → Gerente puede autorizar bloqueo definitivo para uno
```

### Autorización de descuentos
```
Nivel 1 — Asesor Comercial:
  → NO puede dar descuentos (0%)

Nivel 2 — Gerente:
  → Puede autorizar hasta X% (porcentaje TBD por dirección)
  → Autorización registrada en sistema con nombre/fecha/motivo

Nivel 3 — Director Comercial:
  → Descuentos mayores a lo que el gerente puede aprobar
  → Escala automáticamente si excede umbral del gerente

Nota: Los porcentajes exactos serán definidos por la dirección.
      Sistema debe tener configuración editable para estos umbrales.
```

### Autorización de bloqueo definitivo
```
1. Asesor solicita bloqueo → genera solicitud
2. Gerente revisa → aprueba o rechaza
3. Si aprueba → salón queda bloqueado definitivamente para esa fecha
4. Evento "perdedor" debe cambiar de fecha obligatoriamente
```

---

## 23. ROLES Y PERMISOS

### Jerarquía (5 niveles)
```
Super Admin (Arkamia TI)
  └── Admin (Director General)
       └── Director Comercial
            └── Gerente
                 └── Asesor Comercial
```

### Permisos por rol

| Acción | Super Admin | Admin | Director Comercial | Gerente | Asesor |
|--------|:-----------:|:-----:|:------------------:|:-------:|:------:|
| Ver todos los hoteles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cotizar cualquier hotel | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear cotización | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar cotización propia | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar cotización de otros | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver cotizaciones de otros | ✅ | ✅ | ✅ | ✅ | ⚠️ Solo alertas empalme |
| Dar descuentos | ✅ | ✅ | ✅ | ✅ (limitado) | ❌ |
| Autorizar descuentos altos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Autorizar bloqueo definitivo | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configuración del sistema | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reportes gerenciales | ✅ | ✅ | ✅ | ✅ | ❌ |
| Sync Pipedrive config | ✅ | ✅ | ❌ | ❌ | ❌ |
| Eliminar registros | ✅ | ❌ | ❌ | ❌ | ❌ |

### Concepto "Vendedor Multipropiedad"
- TODOS los roles ven TODOS los hoteles de la cadena
- Un asesor de CPMTY puede cotizar un salón de Holiday Inn GDL
- La asignación de hotel es informativa (a qué hotel "pertenece" el asesor), no restrictiva
- El campo `hotelid` en `usuarios` indica hotel base, pero NO limita acceso

---

## 24. REGLAS DE NEGOCIO

### Huella Digital del cliente (deduplicación)
```
Identificador único = teléfono + email

Al crear/importar un cliente:
1. Buscar en BD por teléfono exacto
2. Buscar en BD por email exacto
3. Si coincide → vincular al registro existente (no duplicar)
4. Si no coincide → crear nuevo registro

Implicaciones para sync Pipedrive:
- Al importar persons de Pipedrive, buscar por phone/email antes de crear
- Mantener mapping table: spark_cliente_id ↔ pipedrive_person_id
```

### Tipos de evento y etiquetas
```
Banquete Social:
  - Bodas, XV años, bautizos, cumpleaños, graduaciones
  - Características: más flexibilidad, montajes elaborados, menu degustación
  - Pipeline: {HOTEL} - Banquetes Social

Banquete Comercial:
  - Conferencias, convenciones, seminarios, team building, lanzamientos
  - Características: montaje más estándar, coffee break, equipo AV importante
  - Pipeline: {HOTEL} - Banquetes Comercial

Grupo Social:
  - Grupos que reservan habitaciones para evento social
  - Pipeline: {HOTEL} - Grupos Social

Grupo Comercial:
  - Grupos corporativos que reservan habitaciones
  - Pipeline: {HOTEL} - Grupos Comercial

Tripulación:
  - Aerolíneas y crew (tarifa especial, contrato)
  - Pipeline: {HOTEL} - Tripulación

Chatbot Reserva Individual:
  - Reservas directas vía chatbot
  - Pipeline: {HOTEL} - Chatbot Reserva Individual
```

### Folios de cotización (regla actual)
```
Formato: {ACRONIMO_HOTEL}-{TIPO}-{CONSECUTIVO}
Ejemplo: CPMTY-B-15 (Crowne Plaza MTY, Banquete, #15)

Tipos:
  B = Banquete
  G = Grupo
  T = Tripulación
  R = Reserva Individual
```

### Convenios corporativos y su efecto en precios
- Un convenio otorga descuento automático al cotizar
- El descuento se aplica sin necesidad de autorización manual
- Tiene vigencia (fecha inicio/fin) y versionado
- Puede aplicar a renta, A&B, o ambos (`aplica_a` field)

---

## 25. GUÍA DE DESARROLLO — HANDOFF PARA EQUIPO

### Requisitos de entorno
```bash
# Software requerido
node --version  # v18+ (recomendado v20 LTS o v22)
pnpm --version  # v8+ (NO usar npm ni yarn)
git --version   # Cualquier versión reciente

# Editor recomendado
# VS Code + extensiones: ESLint, Tailwind CSS IntelliSense, Prettier
```

### Setup desde cero en otra computadora
```bash
# 1. Clonar el repositorio
git clone https://github.com/adornodavid/SPARK.git
cd SPARK

# 2. Instalar dependencias
pnpm install

# 3. Crear archivo .env.local (copiar de .env.example o configurar manualmente)
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://yfisrqlhnlryramfdtwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<obtener de Supabase Dashboard>
SUPABASE_SERVICE_ROLE_KEY=<obtener de Supabase Dashboard → Settings → API>
ENCRYPTION_KEY=<generar con: openssl rand -hex 32>
CRON_SECRET=<cualquier string seguro>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email remitente>
SMTP_PASS=<app password de Gmail>
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# 4. NO ejecutar migrations — la BD de producción ya está configurada
# Solo ejecutar migrations si se crea una BD nueva desde cero

# 5. Desarrollo local
pnpm dev
# Abrir http://localhost:3000

# 6. Build de producción (verificar 0 errores TypeScript)
pnpm build
```

### Estructura de branches
```
main           → Deploy automático a Vercel (PRODUCCIÓN)
RubenBranch    → Deploy automático a Vercel (PREVIEW)

Workflow recomendado:
1. Crear feature branch desde main: git checkout -b feature/nombre
2. Desarrollar y probar localmente
3. Push a GitHub: git push origin feature/nombre
4. Crear PR hacia main
5. Merge → deploy automático
```

### Convenciones de código

#### Server Actions (app/actions/)
```typescript
// SIEMPRE usar createServiceSupabaseClient() para acceso a BD
import { createServiceSupabaseClient } from "@/lib/supabase/server";

// SIEMPRE validar sesión antes de cualquier operación
const session = await obtenerSesion();
if (!session) throw new Error("No autenticado");

// PATRÓN: Todas las funciones retornan el resultado directamente
// No envolver en try/catch innecesarios — Next.js maneja errores

// ESCRITURA: Usar nombres REALES de columnas (inglés en convenios)
// LECTURA: Usar VIEWs (vw_o*) que mapean a español
```

#### Componentes (components/)
```typescript
// Usar "use client" SOLO cuando el componente necesita:
// - useState, useEffect, useRef
// - Event handlers (onClick, onChange)
// - Browser APIs

// Shadcn/ui: Importar desde @/components/ui/
// Iconos: Importar desde lucide-react
// Toast: Usar sonner (toast.success, toast.error)
```

#### Estilos (Tailwind v4)
```css
/* Usar tokens semánticos, NO colores hardcodeados */
✅ bg-card, text-foreground, bg-muted, border
❌ bg-white, text-black, bg-gray-100

/* Acento SPARK */
✅ text-lime-600, bg-lime-600, hover:bg-lime-500
❌ text-green-500, text-emerald-600

/* Dark mode es automático via CSS variables (next-themes) */
/* NO usar dark: prefix — los tokens ya se adaptan */
```

### Mejoras pendientes a nivel código (PRIORIDAD ALTA)

#### 1. Validación Zod en Server Actions
```
Estado: Zod está instalado (v3.25.76) pero NO se usa en ningún server action
Impacto: Sin validación, datos malformados pueden entrar a la BD

Tarea:
- Crear schemas Zod en lib/validations/ (uno por entidad)
- Agregar .parse() al inicio de cada server action
- Ejemplo: cotizacionSchema.parse(data) antes de INSERT/UPDATE

Archivos a modificar:
  app/actions/cotizaciones.ts  — PRIORIDAD (maneja dinero)
  app/actions/clientes.ts
  app/actions/reservaciones.ts
  app/actions/catalogos.ts
  app/actions/paquetes.ts
  app/actions/convenios.ts
```

#### 2. Implementar sistema de Pipedrive sync
```
Estado: NO existe — debe construirse desde cero
Prioridad: ALTA (el equipo comercial ya usa Pipedrive activamente)

Archivos a crear:
  lib/pipedrive/client.ts          — HTTP client (fetch con api_token)
  lib/pipedrive/field-mapping.ts   — Mapeo campos custom ↔ SPARK fields
  lib/pipedrive/types.ts           — Types de Deal, Person, Organization, Activity
  app/actions/pipedrive.ts         — Server actions (CRUD menos DELETE)
  app/actions/pipedrive-sync.ts    — Bidirectional sync logic
  app/api/webhooks/pipedrive/route.ts — Webhook para recibir cambios de Pipedrive

Tablas nuevas en Supabase:
  pipedrive_sync_log     — Log de sincronizaciones (timestamp, entity, direction, status)
  pipedrive_field_map    — Mapeo configurable de campos
  pipedrive_id_map       — Relación spark_id ↔ pipedrive_id por entidad
```

#### 3. Salones compuestos (bloqueo cruzado)
```
Estado: NO implementado — actualmente cada salón es independiente
Impacto: CRÍTICO para disponibilidad real (ej. reservar A01 debe bloquear "Acero")

Cambios en BD:
  ALTER TABLE salones ADD COLUMN salon_padre_id INTEGER REFERENCES salones(id);
  -- O crear tabla: salones_composicion (salon_compuesto_id, salon_componente_id)

Archivos a modificar:
  app/actions/cotizaciones.ts   — verificarDisponibilidad() debe incluir compuestos
  app/actions/reservaciones.ts  — Bloqueo debe cascadear a componentes y padre
  app/actions/salones.ts        — Indicar relaciones padre-hijo en UI
  components/admin/salones/     — Mostrar relaciones visualmente
```

#### 4. Sistema de horas extra
```
Estado: NO implementado — cotización no calcula horas extra
Impacto: Error en pricing si evento excede 8 horas

Cambios:
  - Agregar campo `horas_extra` a cotizaciones (integer, default 0)
  - Fórmula: costo_hora_extra = renta_salon / 8
  - Auto-calcular en wizard de cotización si horario excede 8 hrs
  - Mostrar desglose en PDF

Archivos a modificar:
  app/actions/cotizaciones.ts
  components/admin/quotations/quotation-editor.tsx
  lib/email/send-email.ts (generarHTMLCotizacion — incluir en PDF)
  app/actions/pdf.ts
```

#### 5. Sistema de roles granular
```
Estado: PARCIAL — existe tabla usuarios con campo "rol" pero permisos no son granulares
Impacto: Cualquier usuario puede hacer todo (sin restricciones por rol)

Implementación:
  - Crear tabla `permisos` o usar campo JSON en configuraciones
  - Middleware/helper: verificarPermiso(sesion, accion)
  - Aplicar en cada server action y en UI (ocultar botones según rol)
  - 5 roles: super_admin, admin, director_comercial, gerente, asesor

Archivos a crear:
  lib/auth/permissions.ts       — Mapa de permisos por rol
  lib/auth/check-permission.ts  — Helper verificarPermiso()

Archivos a modificar:
  app/actions/*.ts              — Agregar verificarPermiso() en acciones protegidas
  components/admin/sidebar.tsx  — Ocultar secciones según rol
  middleware.ts                 — Considerar restricciones por ruta
```

#### 6. Flujo de empalme y alertas
```
Estado: NO implementado — dos asesores pueden cotizar sin alertas
Impacto: Conflictos de reservación no detectados

Implementación:
  - Al crear cotización, buscar cotizaciones existentes para mismo salón+fecha
  - Si existe → mostrar alerta con info del asesor previo
  - Permitir continuar (soft warning, no hard block)
  - Al confirmar anticipo → notificar al otro asesor
  - Tabla nueva: empalmes (cotizacion_a_id, cotizacion_b_id, estado, resolucion)
```

#### 7. Descuentos con autorización
```
Estado: Campo descuento existe en cotización pero sin flujo de aprobación
Impacto: Asesores pueden dar descuentos sin autorización

Implementación:
  - Tabla: autorizaciones_descuento (cotizacion_id, solicitante_id, aprobador_id, porcentaje, estado, motivo)
  - Al aplicar descuento > 0%, crear solicitud de autorización
  - Gerente/Director recibe notificación para aprobar
  - Descuento solo se refleja en cotización final DESPUÉS de aprobación
  - Configurar umbrales en tabla configuraciones (% máximo por rol)
```

#### 8. Testing (actualmente 0 tests)
```
Estado: CERO tests en todo el proyecto
Impacto: Riesgo alto en refactors y nuevas features

Setup recomendado:
  pnpm add -D vitest @testing-library/react @testing-library/jest-dom playwright

  Prioridad de tests:
  1. Server actions de cotizaciones (manejan dinero)
  2. Lógica de disponibilidad (salones compuestos)
  3. Cálculo de precios (A&B vs renta, horas extra)
  4. Flujo de auth/sesión
  5. E2E: crear cotización completa con Playwright
```

#### 9. Rate limiting en login
```
Estado: NO implementado — login sin protección contra brute force
Impacto: Vulnerabilidad de seguridad

Opciones:
  A) Vercel Edge Middleware con Map (simple, sin BD externa)
  B) Supabase: tabla login_attempts con timestamp + IP
  C) Upstash Redis (si se necesita distribuido)

Regla sugerida: max 5 intentos por IP en 15 minutos → bloqueo 30 min
```

#### 10. Mejorar sistema de montaje/desmontaje
```
Estado: El campo horario existe pero no se valida la ventana de 10 horas
Impacto: Calendario muestra 8 hrs pero el salón está ocupado 10

Cambios:
  - Al guardar cotización con horario 14:00-22:00:
    → Bloquear salón de 13:00 (montaje) a 23:00 (desmontaje)
  - Mostrar en calendario la ventana completa (10 hrs) con diferente color
    → Montaje: gris claro
    → Evento: color del tipo (social=azul, corporativo=verde)
    → Desmontaje: gris claro
```

### Mejoras pendientes (PRIORIDAD MEDIA)

#### 11. Notificaciones en tiempo real
- Usar Supabase Realtime para detectar cambios en cotizaciones
- Alertar a asesores cuando su cotización tiene empalme
- Notificar gerentes de solicitudes de descuento pendientes

#### 12. Reportes gerenciales funcionales
- El módulo de reportes existe pero necesita queries reales
- KPIs: conversion rate, revenue por hotel, tiempo promedio de cierre
- Integrar datos de Pipedrive para reportes unificados

#### 13. Optimización para iPad/tablet
- SPARK se usa en iPad durante visitas presenciales
- Mejorar touch targets, sidebar collapsible, modo presentación
- Landing de salones ya es fullscreen — extender a cotización rápida

#### 14. CI/CD pipeline
```
Archivo a crear: .github/workflows/ci.yml

Steps recomendados:
  1. pnpm install
  2. pnpm lint (si se configura ESLint)
  3. pnpm build (TypeScript strict, 0 errores)
  4. pnpm test (cuando existan tests)
  5. Deploy automático ya existe (Vercel + GitHub)
```

---

## 26. ORACLE OPERA S&C — REFERENCIA

El cliente actualmente usa **Oracle OPERA Sales & Catering** para gestionar eventos y banquetes. SPARK reemplaza la funcionalidad de ventas/cotización de este sistema.

**Módulos de OPERA que SPARK cubre o cubrirá:**
| Módulo OPERA | Equivalente SPARK | Estado |
|-------------|-------------------|--------|
| Bookings (reservas de evento) | Cotizaciones + Reservaciones | ✅ Implementado |
| Catering (menús y servicios) | Menus + Paquetes + Complementos | ✅ Implementado |
| Resource Management (salones) | Salones + Montajes | ✅ Implementado |
| Account Management (clientes) | Clientes + CRM | ✅ Implementado |
| Reports | Reportes | ⚠️ Parcial |
| Billing | Pricing + Pagos | ⚠️ Necesita horas extra y descuentos |
| Calendar / Availability | Dashboard + Calendario | ✅ Implementado (falta compuestos) |
| Contracts (convenios) | Convenios | ✅ Implementado |

**Lo que SPARK NO reemplaza de OPERA:**
- Property Management (PMS — gestión de habitaciones/check-in/check-out)
- Night Audit
- Housekeeping
- Front Desk
- Revenue Management (yield)

> SPARK es solo para el equipo COMERCIAL y BANQUETES. La operación hotelera sigue en OPERA.
