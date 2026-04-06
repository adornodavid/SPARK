# SPARK — Contexto del Sistema

Carga este contexto completo del sistema SPARK antes de hacer cualquier cambio.

## Qué es SPARK

**Portal Milenium Comercial Banquetes** — Sistema de gestión de cotizaciones y reservaciones de eventos para grupo hotelero multi-propiedad. Permite a vendedores generar cotizaciones rápidas de salones, convertirlas en reservaciones, y tener visibilidad de disponibilidad de espacios.

## Ubicación del proyecto

```
C:\Claude\projects\SPARK
```

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + Shadcn/ui (estilo New York)
- Supabase (PostgreSQL) como base de datos en la nube
- Server Actions para toda la lógica de backend
- Sesión encriptada con AES + cookies HTTP-only

## Estructura de carpetas clave

```
app/
  (protected)/          → Rutas protegidas (requieren sesión activa)
    layout.tsx          → Verifica sesión, monta sidebar + header, pasa userRole al sidebar
    admin/              → Módulo de administración (solo roles SuperAdmin y Admin)
      page.tsx          → Tarjetas de navegación: Usuarios, Encriptación, Configuraciones
      usuarios/         → CRUD de usuarios del sistema
        page.tsx        → Listado con tabla + KPIs (total, activos, inactivos)
        ver/page.tsx    → Detalle de usuario por bloques (recibe ?id=X)
        editar/page.tsx → Edición de acceso + cambio de contraseña (recibe ?id=X)
      encrypt/          → Herramientas de encriptación/hash (solo SuperAdmin)
      roles/
      permisos/
      roles-permisos/
      cargas/
    cotizaciones/       → Módulo core de cotizaciones (renombrado a "Eventos" en UI)
    reservaciones/      → Módulo core de reservaciones
    salones/            → Gestión de salones/espacios de eventos
    hoteles/            → Gestión de hoteles
    clientes/           → Gestión de clientes
    menus/              → Catálogo de menús
    packages/           → Paquetes de eventos
    agreements/         → Convenios corporativos
    reportes/           → Reportes y analytics
    crm/                → CRM con pipeline y actividades
    configuraciones/    → Configuraciones especiales (tabla configuraciones en BD)
  auth/                 → Login, sign-up, forgot-password
  actions/              → TODAS las Server Actions (backend)
    cotizaciones.ts
    reservaciones.ts
    salones.ts
    hoteles.ts
    clientes.ts
    usuarios.ts         → CRUD usuarios + obtenerUsuarioDetalle, actualizarAccesoUsuario, actualizarPasswordUsuario
    catalogos.ts
    configuraciones.ts  → Incluye obtenerRoles()
    session.ts
    utilerias.ts        → Encrypt, Desencrypt, HashData

components/
  ui/                   → Shadcn/ui components (NO modificar)
  admin/                → Componentes del sistema
    admin-sidebar.tsx   → Sidebar fijo 100px + offcanvas 64 de ancho. Recibe userRole prop.
    admin-header.tsx    → Header con info del usuario
    usuarios/           → Componentes de usuarios admin
      usuarios-table.tsx → Tabla con acciones: Ver, Editar, Inactivar, Eliminar
    quotations/         → Componentes de cotizaciones
    bookings/           → Componentes de reservaciones
    clients/            → Componentes de clientes
    agreements/         → Componentes de convenios (patrón de referencia para tablas)

types/                  → Interfaces TypeScript
  common.ts             → ApiResponse, ddlItem, props comunes
  cotizaciones.ts       → oCotizacion
  reservaciones.ts      → oReservacion
  clientes.ts           → oClientes
  salones.ts            → oSalon, oMontajeXSalon
  hoteles.ts            → oHotel
  usuarios.ts           → oUsuario, oSession

lib/
  supabase/client.ts    → Cliente browser
  supabase/server.ts    → Cliente servidor (con cookies)
  encryption.ts         → encryptData / decryptData (AES)
  utils.ts              → cn() y helpers
  email/                → Templates y envío de emails
  integrations/         → Pipedrive CRM, WhatsApp (pendientes de activar)
```

## Entidades principales y sus tablas/vistas

| Entidad | Tabla | Vista para SELECT |
|---------|-------|-------------------|
| Hoteles | `hoteles` | `vw_ohoteles` |
| Salones | `salones` | — |
| Montajes | `montajes` | — |
| Cotizaciones | `cotizaciones` | `vw_ocotizaciones` |
| Reservaciones | `reservaciones` | `vw_oreservaciones` |
| Clientes | `clientes` | — |
| Usuarios | `usuarios` | `vw_usuarios` (NO tiene columna `activo` ni `imgurl`, usa `imagen`) |
| Usuarios x Hotel | `usuariosxhotel` | — |
| Roles | `roles` | — |

### Columnas de vw_usuarios
`usuarioid, nombrecompleto, usuario, email, contraseña, rolid, rol, telefono, imagen, ultimoingreso, fechacreacion`

**IMPORTANTE:** La vista `vw_usuarios` NO incluye la columna `activo`. Para obtener el estatus activo/inactivo se debe consultar directamente la tabla `usuarios`. El campo de imagen en la vista se llama `imagen`, no `imgurl`.

## Tipos TypeScript importantes

```typescript
// Respuesta estándar de todas las Server Actions
{ success: boolean; error: string; data: T | null }

// Item de dropdown list
interface ddlItem { value: string; text: string }

// Cotización
interface oCotizacion {
  id, folio, hotelid, hotel, salonid, salon, montajeid, montaje,
  clienteid, cliente, nombreevento, tipoevento, horainicio, horafin,
  numeroinvitados, estatus, subtotal, impuestos, totalmonto,
  porcentajedescuento, montodescuento, notas, validohasta,
  cotizadopor, fechaactualizacion, fechacreacion, fechainicio, fechafin
}

// Sesión del usuario
interface oSession {
  SesionActiva: boolean
  UsuarioId: string
  Email: string
  Usuario: string
  NombreCompleto: string
  RolId: string
  Rol: string
  Hoteles: string
}
```

## Reglas de negocio críticas

1. **Folio de cotización**: `ACRONIMO-E-CONSECUTIVO` (ej: `LAP-E-001`). El consecutivo es el máximo existente + 1.
2. **Sesión**: Se valida en cada ruta protegida. Sin sesión → redirect a `/auth/login`.
3. **Multi-hotel**: Cada usuario tiene hoteles asignados en `usuariosxhotel`. Solo ve datos de sus hoteles.
4. **Activo/Inactivo**: Todos los registros tienen columna `activo boolean`. Nunca se borran físicamente.
5. **Montajes**: Un salón puede tener múltiples configuraciones (teatro, banquete, cóctel, etc.) con capacidades distintas.
6. **Conversión**: Una cotización aceptada se convierte en reservación (flujo pendiente de validar).
7. **Sidebar condicional**: El icono Admin en sidebar solo aparece si `userRole` es "SuperAdmin" o "Admin". Se pasa desde layout.tsx.
8. **Unicidad de usuarios**: Al crear/editar usuarios, validar que `usuario` y `email` sean únicos excluyendo el ID actual del usuario que se edita.
9. **Contraseñas**: Se hashean con `HashData()` de `actions/utilerias.ts` (bcrypt) antes de guardar.

## Layout del sistema

- Sidebar fijo izquierdo: **100px** de ancho con iconos + texto pequeño
- Offcanvas: **256px** (w-64) con navegación completa
- Contenido principal: `ml-[100px]` con header + main scrollable
- Color de fondo del main: `bg-background`
- Padding del main: `p-6`

### Iconos del sidebar colapsado
- Dashboard (Home)
- Eventos (PartyPopper) — antes era FileText
- CRM (Target)
- Admin (ShieldCheck) — solo visible para SuperAdmin/Admin
- Salones oculto de barra colapsada, visible en offcanvas

## Git y Deploy

- **Repositorio:** adornodavid/SPARK (GitHub)
- **Branch producción:** main (auto-deploy a Vercel)
- **Branch desarrollo Omar:** OmarBranch
- **Branch desarrollo Rubén:** RubenBranch
- **Flujo:** Trabajar en OmarBranch → PR a main → merge después de revisión

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_KEY
NEXT_PUBLIC_APP_URL
```

## Comandos del proyecto

```bash
pnpm run dev    # Servidor de desarrollo en localhost:3000 (o 3001 si 3000 está ocupado)
pnpm run build  # Build de producción
pnpm run lint   # ESLint
```

## Notas de desarrollo (aprendizajes)

- El campo `activo` de Supabase puede llegar como string `"true"`/`"false"` en vez de boolean. Siempre comparar con ambos: `valor === true || valor === "true"`.
- La vista `vw_usuarios` no tiene `activo` — se debe obtener de la tabla `usuarios` directamente.
- El campo de imagen en `vw_usuarios` se llama `imagen`, no `imgurl`.
- GitHub CLI (`gh`) está instalado pero pendiente de autenticación (`gh auth login`).
