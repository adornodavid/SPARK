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
    layout.tsx          → Verifica sesión, monta sidebar + header
    cotizaciones/       → Módulo core de cotizaciones
    reservaciones/      → Módulo core de reservaciones
    salones/            → Gestión de salones/espacios de eventos
    hoteles/            → Gestión de hoteles
    clientes/           → Gestión de clientes
    menus/              → Catálogo de menús
    packages/           → Paquetes de eventos
    agreements/         → Convenios corporativos
    reportes/           → Reportes y analytics
  auth/                 → Login, sign-up, forgot-password
  actions/              → TODAS las Server Actions (backend)
    cotizaciones.ts
    reservaciones.ts
    salones.ts
    hoteles.ts
    clientes.ts
    usuarios.ts
    catalogos.ts
    session.ts
    utilerias.ts

components/
  ui/                   → Shadcn/ui components (NO modificar)
  admin/                → Componentes del sistema
    admin-sidebar.tsx   → Sidebar fijo 100px + offcanvas 64 de ancho
    admin-header.tsx    → Header con info del usuario
    quotations/         → Componentes de cotizaciones
    bookings/           → Componentes de reservaciones
    clients/            → Componentes de clientes

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
| Usuarios | `usuarios` | — |
| Usuarios x Hotel | `usuariosxhotel` | — |
| Roles | `roles` | — |

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
  UsuarioId: number
  NombreCompleto: string
  Rol: string
  HotelesAsignados: number[]
}
```

## Reglas de negocio críticas

1. **Folio de cotización**: `ACRONIMO-E-CONSECUTIVO` (ej: `LAP-E-001`). El consecutivo es el máximo existente + 1.
2. **Sesión**: Se valida en cada ruta protegida. Sin sesión → redirect a `/auth/login`.
3. **Multi-hotel**: Cada usuario tiene hoteles asignados en `usuariosxhotel`. Solo ve datos de sus hoteles.
4. **Activo/Inactivo**: Todos los registros tienen columna `activo boolean`. Nunca se borran físicamente.
5. **Montajes**: Un salón puede tener múltiples configuraciones (teatro, banquete, cóctel, etc.) con capacidades distintas.
6. **Conversión**: Una cotización aceptada se convierte en reservación (flujo pendiente de validar).

## Layout del sistema

- Sidebar fijo izquierdo: **100px** de ancho con iconos + texto pequeño
- Offcanvas: **256px** (w-64) con navegación completa
- Contenido principal: `ml-[100px]` con header + main scrollable
- Color de fondo del main: `bg-[#fffdfb]`
- Padding del main: `p-6`

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
pnpm run dev    # Servidor de desarrollo en localhost:3000
pnpm run build  # Build de producción
pnpm run lint   # ESLint
```
