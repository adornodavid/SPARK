# Contexto: Extracción Pipedrive → Supabase

## Fecha: 2026-04-09 / 2026-04-10

## Resumen
Se implementó el módulo de extracción de datos desde Pipedrive CRM hacia Supabase.
El hub está en `/admin/extraccion-pipedrive` y contiene 5 endpoints implementados.

---

## Endpoints Implementados

### 1. Persons (ya existía antes de esta sesión)
- **Tabla Supabase:** `persons` (sin prefijo pip_)
- **SQL:** `.docs/create-table-persons.sql`
- **Ruta:** `/admin/extraccion-pipedrive/persons`
- **Endpoint Pipedrive:** `GET /persons`
- **Campos clave:** nombre, email (JSONB), telefono (JSONB), puesto, organizacion, propietario, dirección postal, campos custom (hash keys), estadísticas de tratos/actividades
- **Hash keys custom fields:**
  - `50911942c...` = Division / Filial / Area
  - `cef83686b...` = Tipo de Contacto
  - `b69ae48b0...` = Tipo de reservas
  - `aa2812f83...` = Potencial mensual en CN
  - `e645f305b...` = Cumpleaños
  - `8026c65fb...` = Afiliado Fidelización
  - `a3e32f528...` = Whatsapp chat link
  - `be06a8605...` = Dirección custom

### 2. Organizations (creado en esta sesión)
- **Tabla Supabase:** `organizations` (sin prefijo pip_)
- **SQL:** `.docs/create-table-organizations.sql`
- **Ruta:** `/admin/extraccion-pipedrive/organizations`
- **Endpoint Pipedrive:** `GET /organizations`
- **Campos tabla:** nombre, propietario, dirección (desglosada), cc_email, estadísticas (personas_count, tratos, actividades, emails, archivos, notas, seguidores), etiquetas, visibilidad, fechas actividad
- **Columnas en tabla UI:** ID PD, Nombre, Ciudad, País, Personas, Tratos Abiertos, Tratos Ganados, Propietario, Estatus

### 3. Activities (creado en esta sesión)
- **Tabla Supabase:** `pip_activities` (CON prefijo pip_)
- **SQL:** `.docs/create-table-pip-activities.sql`
- **Ruta:** `/admin/extraccion-pipedrive/activities`
- **Endpoint Pipedrive:** `GET /activities`
- **Campos tabla:** asunto, tipo, nota, descripcion_publica, prioridad, relaciones (trato, lead, persona, org, proyecto), propietario/creador, fecha/hora/duración, ubicación (desglosada), participantes (JSONB), asistentes (JSONB), conferencia, ocupado
- **Columnas en tabla UI:** ID PD, Asunto, Tipo (badge), Fecha, Hora, Duración, Persona ID, Org ID, Trato ID, Estatus (Completado/Pendiente)

### 4. Tasks (creado en esta sesión)
- **Tabla Supabase:** `pip_tasks` (CON prefijo pip_)
- **SQL:** `.docs/create-table-pip-tasks.sql`
- **Ruta:** `/admin/extraccion-pipedrive/tasks`
- **Endpoint Pipedrive:** `GET /tasks`
- **Campos tabla:** titulo, descripcion, proyecto_id, tarea_padre_id, asignado_id, asignado_ids (JSONB), creador_id, completado, fecha_vencimiento
- **Columnas en tabla UI:** ID PD, Título, Descripción, Fecha Vencimiento, Proyecto ID, Asignado ID, Creador ID, Estatus (Completado/Pendiente)

### 5. Notes (creado en esta sesión)
- **Tabla Supabase:** `pip_notes` (CON prefijo pip_)
- **SQL:** `.docs/create-table-pip-notes.sql`
- **Ruta:** `/admin/extraccion-pipedrive/notes`
- **Endpoint Pipedrive:** `GET /notes`
- **Campos tabla:** contenido (HTML), relaciones (trato, lead, persona, org, proyecto) con nombres resueltos, usuario creador con email, ultimo_editor_id, flags de fijado (trato, org, persona, proyecto, lead)
- **Columnas en tabla UI:** ID PD, Contenido (HTML limpio truncado 120 chars), Persona, Organización, Trato, Creador, Fecha, Estatus (Activo/Eliminado)

---

## Arquitectura / Patrón por Endpoint

Cada endpoint sigue el mismo patrón:

### Server Actions (`app/actions/pipedrive.ts`)
1. **`extraerLote[Endpoint](start)`** → Fetch lote de 100 desde Pipedrive, upsert en Supabase con `ignoreDuplicates`
2. **`verificarPipedrive[Endpoint]()`** → Test de conexión API con timeout 10s
3. **`obtener[Endpoint]Supabase(pagina, porPagina, busqueda)`** → Paginación con búsqueda OR en campos relevantes
4. **`conteo[Endpoint]Supabase()`** → Count exacto

### Página (`app/(protected)/admin/extraccion-pipedrive/[endpoint]/page.tsx`)
- Client component ("use client")
- Status cards: conexión Pipedrive + conteo Supabase
- Control de extracción: Play/Stop con cancelRef (useRef)
- Barra de progreso con stats: Procesados, Insertados, Omitidos, Errores, Lote
- Tabla paginada con búsqueda y refresh
- Paginación: Anterior/Siguiente con indicador X-Y de Z

### Hub (`app/(protected)/admin/extraccion-pipedrive/page.tsx`)
- Grid de cards con iconos (Users, CheckSquare, Activity, Building2, StickyNote)
- Click navega a la ruta del endpoint

---

## Convención de Nombres

- **Tablas anteriores** (persons, organizations): SIN prefijo
- **Tablas nuevas** (a partir de activities): CON prefijo `pip_` → `pip_activities`, `pip_tasks`, `pip_notes`
- **Regla acordada:** A partir de ahora todas las tablas de Pipedrive llevan prefijo `pip_`

---

## Archivos Modificados/Creados

### Creados:
- `.docs/create-table-organizations.sql`
- `.docs/create-table-pip-activities.sql`
- `.docs/create-table-pip-tasks.sql`
- `.docs/create-table-pip-notes.sql`
- `app/(protected)/admin/extraccion-pipedrive/organizations/page.tsx`
- `app/(protected)/admin/extraccion-pipedrive/activities/page.tsx`
- `app/(protected)/admin/extraccion-pipedrive/tasks/page.tsx`
- `app/(protected)/admin/extraccion-pipedrive/notes/page.tsx`

### Modificados:
- `app/actions/pipedrive.ts` — Se agregaron actions para organizations, activities, tasks y notes
- `app/(protected)/admin/extraccion-pipedrive/page.tsx` — Se actualizó hub: companies→organizations, se agregó Notes

---

## Pipedrive Config
- **API Token:** en `PIPEDRIVE_API_TOKEN` (.env.local)
- **Base URL:** `https://api.pipedrive.com/v1`
- **Company domain:** `mileniumgrupohotele`
- **Supabase:** client con service role key para server actions

---

## Endpoints Pipedrive Pendientes (no implementados)
Deals, DealFields, Leads, LeadLabels, LeadFields, LeadSources, Products, ProductFields, Projects, ProjectTemplates, NoteFields, Files, Filters, Pipelines, Stages, Goals, Users, Roles, PermissionSets, ActivityTypes, ActivityFields, OrganizationFields, OrganizationRelationships, PersonFields, CallLogs, Channels, Currencies, Mailbox, Meetings, Recents, UserConnections, UserSettings, Webhooks, ItemSearch, Billing, LegacyTeams

---

## Tablas Creadas en Supabase (usuario confirmó)
- `persons` ✅
- `organizations` ✅
- `pip_activities` — pendiente confirmar
- `pip_tasks` — pendiente confirmar
- `pip_notes` — pendiente confirmar
