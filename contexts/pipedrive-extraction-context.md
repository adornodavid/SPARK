# Contexto: Extracción Pipedrive → Supabase

## Fecha: 2026-04-09 / 2026-04-10 / 2026-04-10 (sesión 3)

## Resumen
Se implementó el módulo de extracción de datos desde Pipedrive CRM hacia Supabase.
El hub está en `/admin/extraccion-pipedrive` y contiene 5 endpoints implementados.

En la sesión del 2026-04-10 se realizaron correcciones críticas de migración de vistas,
tablas de alimentos/platillos, precio de salón, y mejoras a la extracción de Persons.

---

## Correcciones Realizadas (Sesión 2026-04-10)

### 1. Migración vw_ocotizaciones → vw_oeventos
- **Problema:** La vista `vw_ocotizaciones` fue eliminada de Supabase en una sesión anterior (se migró el board a `vw_oeventos`) pero quedaban 16 referencias en código
- **Fix:** Reemplazadas todas las referencias en 7 archivos:
  - `app/actions/cotizaciones.ts` (4 refs)
  - `app/actions/crm.ts` (6 refs)
  - `app/actions/recordatorios.ts` (2 refs)
  - `app/actions/pdf.ts` (1 ref)
  - `app/actions/pagos.ts` (1 ref)
  - `lib/email/send-email.ts` (1 ref)
  - `app/(protected)/cotizaciones/resumen/page.tsx` (1 ref)
- **Eliminado:** Query suplementario en `objetoCotizacion()` que buscaba `categoriaevento` y `estatusid` en tabla `cotizaciones` — `vw_oeventos` ya incluye ambos campos

### 2. Categoría de Evento no cargaba en edición
- **Problema:** `vw_oeventos` devuelve `categoriaevento: "Social"` (nombre texto) pero el Select del formulario usa IDs numéricos como values
- **Fix:** En `quotation-form.tsx`, al cargar cotización para edición, se resuelve el nombre a ID consultando `categoriaeventos` antes de setear el formulario
- **También:** `loadTiposEvento()` ahora recibe el ID numérico en vez del nombre

### 3. Precio del salón no aparecía en presupuesto
- **Problema:** La tabla `salones` tiene `costo: 38969` (precio real) y `preciopordia: null`. La vista `vw_osalones` solo expone `preciopordia` que está vacío
- **Fix:** En `objetoSalon()` (`salones.ts`), si `preciopordia` es null, se consulta `costo` directamente de la tabla `salones` como fallback

### 4. Tablas alimentos/platillos incorrectas
- **Problema:** El mapeo `TABLA_POR_TIPO` en `catalogos.ts` apuntaba:
  - `alimentos` → tabla `platillos` (incorrecto)
  - `platillos` → tabla `platillositems` (NO EXISTE)
- **Fix:** Corregido a:
  - `alimentos` → tabla `menus` (menús de alimentos con nombre, costo, hotelid, documentopdf)
  - `platillos` → tabla `platillos` (platillos individuales con FK `platilloid` → menus.id)
- **Archivos:** Todas las referencias a `platillositems` reemplazadas por `platillos` en `catalogos.ts` (funciones: `buscarPlatillosItems`, `obtenerPlatillosCotizacion`, `obtenerPlatilloItemPorId`)

### 5. Mejoras a extracción de Persons en Pipedrive
- **Tarjetas compactas:** 3 tarjetas con `w-fit` (Pipedrive API, Persons en Pipedrive, Persons en Supabase) + tarjeta de extracción también `w-fit`
- **Conteo Pipedrive:** Botón "Validar" que recorre con `limit=500` para contar total (la API no expone total directo)
- **Extracción del más nuevo al más antiguo:** `sort=add_time DESC` para encontrar registros nuevos primero
- **Detección inteligente de duplicados:** Antes de insertar, consulta Supabase por `pipedrive_id` existentes y solo inserta los nuevos (insert individual, no bulk)
- **Modos de extracción con checkboxes:**
  - "Solo nuevos" (default): corta al primer lote sin inserciones nuevas
  - "Recorrido completo": recorre todos los registros de Pipedrive
- **Detalle de errores:** Sección roja que muestra cada error con PD #ID, nombre y mensaje de error
- **Tabla simplificada:** Columnas: Id, Pd, Nombre, Email, Teléfono, Puesto, Estatus (con `table-fixed w-full` y `truncate`)
- **Búsqueda mejorada:** Si es número busca por id/pipedrive_id exacto. Si es texto busca por nombre, organizacion_nombre, puesto

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
1. **`extraerLote[Endpoint](start)`** → Fetch lote de 100 desde Pipedrive (sort=add_time DESC para Persons), compara con Supabase, inserta solo los nuevos
2. **`verificarPipedrive[Endpoint]()`** → Test de conexión API con timeout 10s
3. **`obtener[Endpoint]Supabase(pagina, porPagina, busqueda)`** → Paginación con búsqueda OR en campos relevantes
4. **`conteo[Endpoint]Supabase()`** → Count exacto
5. **`conteoPipedrive()`** → (Solo Persons) Conteo total recorriendo con limit=500

### Página (`app/(protected)/admin/extraccion-pipedrive/[endpoint]/page.tsx`)
- Client component ("use client")
- Status cards con `w-fit`: conexión Pipedrive + conteo Pipedrive (con botón Validar) + conteo Supabase
- Control de extracción con checkboxes (Solo nuevos / Recorrido completo)
- Barra de progreso con stats: Procesados, Insertados, Omitidos, Errores, Lote
- Detalle de errores: sección roja con PD #ID, nombre y mensaje de error
- Tabla paginada con búsqueda (por id, nombre, email, teléfono, organización) y refresh
- Paginación: Anterior/Siguiente con indicador X-Y de Z

### Hub (`app/(protected)/admin/extraccion-pipedrive/page.tsx`)
- Grid de cards con iconos (Users, CheckSquare, Activity, Building2, StickyNote)
- Click navega a la ruta del endpoint

---

## Estructura de Tablas en Supabase

### Tabla `salones` vs vista `vw_osalones`
- `salones.costo` = precio real del salón (ej: 38969)
- `salones.preciopordia` = generalmente null
- `vw_osalones` expone `preciopordia` pero NO `costo`
- El código hace fallback: si `preciopordia` es null, consulta `costo` de la tabla directa

### Tablas de alimentos
- `menus` → Menús/alimentos (id, nombre, costo, hotelid, documentopdf)
- `platillos` → Platillos individuales (id, nombre, costo, platilloid FK→menus.id, hotelid, tipo)
- `platillositems` → NO EXISTE (referencias eliminadas)

### Vista `vw_oeventos` (reemplaza a `vw_ocotizaciones`)
- Fuente única para cotizaciones/eventos
- Incluye: categoriaevento (texto, ej: "Social"), estatusid, todos los campos de evento
- La tabla base es `eventos` (no `cotizaciones`)

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

### Modificados (sesión 2026-04-10):
- `app/actions/pipedrive.ts` — conteoPipedrive(), extraerLotePersons con sort DESC, detección duplicados, ErrorDetalle
- `app/actions/cotizaciones.ts` — migración vw_ocotizaciones→vw_oeventos, eliminación query suplementario
- `app/actions/catalogos.ts` — corrección TABLA_POR_TIPO (menus/platillos), funciones platillos
- `app/actions/salones.ts` — fallback costo cuando preciopordia es null
- `app/actions/crm.ts` — migración vw_ocotizaciones→vw_oeventos
- `app/actions/pagos.ts` — migración vw_ocotizaciones→vw_oeventos
- `app/actions/pdf.ts` — migración vw_ocotizaciones→vw_oeventos
- `app/actions/recordatorios.ts` — migración vw_ocotizaciones→vw_oeventos
- `lib/email/send-email.ts` — migración vw_ocotizaciones→vw_oeventos
- `app/(protected)/cotizaciones/resumen/page.tsx` — migración vw_ocotizaciones→vw_oeventos
- `app/(protected)/admin/extraccion-pipedrive/persons/page.tsx` — tarjetas w-fit, checkboxes modo, errores detalle, tabla simplificada, búsqueda mejorada
- `components/admin/quotations/quotation-form.tsx` — resolución categoriaevento nombre→ID

---

## Pipedrive Config
- **API Token:** en `PIPEDRIVE_API_TOKEN` (.env.local + Vercel env vars)
- **Base URL:** `https://api.pipedrive.com/v1`
- **Company domain:** `mileniumgrupohotele`
- **Supabase:** client con service role key para server actions
- **Nota:** La API de Pipedrive NO expone total en paginación, solo `more_items_in_collection` y `next_start`

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
