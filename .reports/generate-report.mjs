import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  PageBreak, TabStopPosition, TabStopType
} from "docx";
import { writeFileSync } from "fs";

// ── Helpers ──────────────────────────────────────────────────────────────────

const heading = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({ heading: level, spacing: { before: 300, after: 120 }, children: [new TextRun({ text, bold: true })] });

const para = (text, opts = {}) =>
  new Paragraph({ spacing: { after: 80 }, ...opts, children: [new TextRun(text)] });

const boldPara = (label, value) =>
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: label, bold: true }), new TextRun(value)] });

const bullet = (text, level = 0) =>
  new Paragraph({ bullet: { level }, spacing: { after: 40 }, children: [new TextRun(text)] });

const cellShading = { type: ShadingType.SOLID, color: "1a1a2e", fill: "1a1a2e" };
const headerCell = (text) => new TableCell({
  shading: cellShading,
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20 })] })],
});
const cell = (text) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
});

const makeTable = (headers, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: headers.map(h => headerCell(h)) }),
    ...rows.map(r => new TableRow({ children: r.map(c => cell(c)) })),
  ],
});

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ── Document ─────────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: { run: { size: 22, font: "Calibri" } },
    },
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
    },
    children: [
      // ── PORTADA ──
      new Paragraph({ spacing: { before: 3000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "SPARK", bold: true, size: 72, color: "1a1a2e" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "Portal Comercial, Banquetes y Habitaciones", size: 32, color: "555555" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "Reporte Tecnico del Desarrollo", size: 28, color: "888888" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Fecha: 11 de Marzo de 2026", size: 24, color: "999999" })],
      }),

      pageBreak(),

      // ── 1. RESUMEN EJECUTIVO ──
      heading("1. Resumen Ejecutivo"),
      para("SPARK es un sistema web full-stack de gestion hotelera que abarca los modulos de ventas comerciales, banquetes, cotizaciones, reservaciones, CRM y administracion de habitaciones. Esta disenado para la operacion de MGHM (Milenium Grand Hotel Management)."),
      para(""),
      boldPara("Tipo de aplicacion: ", "Aplicacion web full-stack (SPA con SSR)"),
      boldPara("Framework principal: ", "Next.js 16.0.10 con App Router y Turbopack"),
      boldPara("Lenguaje: ", "TypeScript / JavaScript (TSX/JSX)"),
      boldPara("Base de datos: ", "Supabase (PostgreSQL gestionado)"),
      boldPara("Hosting: ", "Vercel"),
      boldPara("Repositorio: ", "https://github.com/adornodavid/SPARK"),

      pageBreak(),

      // ── 2. STACK TECNOLOGICO ──
      heading("2. Stack Tecnologico"),

      heading("2.1 Frontend", HeadingLevel.HEADING_2),
      makeTable(["Tecnologia", "Version", "Proposito"], [
        ["Next.js", "16.0.10", "Framework React con SSR, App Router, Turbopack"],
        ["React", "19.2.0", "Biblioteca de UI (componentes)"],
        ["TypeScript", "5.x", "Tipado estatico para JavaScript"],
        ["Tailwind CSS", "4.1.9", "Framework de estilos utilitario"],
        ["Radix UI", "Multiples", "Componentes UI accesibles sin estilos (40+ primitivos)"],
        ["Shadcn/ui", "Integrado", "Componentes pre-estilizados basados en Radix"],
        ["Lucide React", "0.454.0", "Biblioteca de iconos SVG"],
        ["Recharts", "2.15.4", "Graficas y visualizacion de datos"],
        ["React Hook Form", "7.60.0", "Manejo de formularios"],
        ["Zod", "3.25.76", "Validacion de esquemas"],
        ["date-fns", "4.1.0", "Utilidades de fechas"],
        ["Embla Carousel", "8.5.1", "Componente carrusel/slider"],
        ["React Day Picker", "9.8.0", "Selector de fechas"],
        ["cmdk", "1.0.4", "Paleta de comandos"],
        ["Sonner", "1.7.4", "Notificaciones toast"],
      ]),

      para(""),
      heading("2.2 Backend", HeadingLevel.HEADING_2),
      makeTable(["Tecnologia", "Version", "Proposito"], [
        ["Supabase JS", "2.86.0", "Cliente de base de datos PostgreSQL"],
        ["Supabase SSR", "0.8.0", "Integracion server-side con Supabase"],
        ["bcryptjs", "3.0.3", "Hash de contrasenas"],
        ["CryptoJS", "4.2.0", "Encriptacion AES para sesiones"],
        ["Nodemailer", "8.0.1", "Envio de correos SMTP"],
        ["jsPDF", "2.5.2", "Generacion de PDFs"],
        ["Next Auth", "4.24.13", "Framework de autenticacion (disponible)"],
      ]),

      para(""),
      heading("2.3 DevOps y Herramientas", HeadingLevel.HEADING_2),
      makeTable(["Herramienta", "Proposito"], [
        ["Vercel", "Hosting y CI/CD (deploy automatico)"],
        ["Vercel Analytics", "Metricas de uso y rendimiento"],
        ["pnpm", "Gestor de paquetes (rapido, eficiente en disco)"],
        ["Git + GitHub", "Control de versiones y colaboracion"],
        ["Turbopack", "Bundler de desarrollo (integrado en Next.js 16)"],
      ]),

      pageBreak(),

      // ── 3. METRICAS DEL PROYECTO ──
      heading("3. Metricas del Proyecto"),

      heading("3.1 Conteo de Archivos", HeadingLevel.HEADING_2),
      makeTable(["Tipo de Archivo", "Cantidad", "Descripcion"], [
        [".tsx", "192", "Componentes React con TypeScript"],
        [".ts", "51", "Modulos TypeScript (actions, types, utils)"],
        [".css", "2", "Hojas de estilo globales"],
        [".json", "4", "Configuracion (package.json, tsconfig, etc.)"],
        [".md", "1", "Documentacion"],
        ["TOTAL", "250", "Archivos fuente (sin node_modules, .next, .git)"],
      ]),

      para(""),
      heading("3.2 Resumen Cuantitativo", HeadingLevel.HEADING_2),
      makeTable(["Metrica", "Cantidad"], [
        ["Paginas / Rutas", "54"],
        ["Componentes reutilizables", "116"],
        ["Archivos de Server Actions", "21"],
        ["Funciones exportadas (actions)", "170+"],
        ["Tablas y vistas en BD", "45+"],
        ["Tipos TypeScript (archivos)", "14"],
        ["Hooks personalizados", "2"],
        ["Context Providers", "1"],
        ["Rutas API", "2"],
        ["Variables de entorno", "13"],
      ]),

      pageBreak(),

      // ── 4. ARQUITECTURA ──
      heading("4. Arquitectura del Sistema"),

      para("El proyecto sigue la arquitectura de Next.js App Router con separacion clara de responsabilidades:"),
      para(""),

      heading("4.1 Estructura de Directorios", HeadingLevel.HEADING_2),
      makeTable(["Directorio", "Contenido", "Funcion"], [
        ["app/", "Paginas y layouts", "Rutas del App Router (54 rutas)"],
        ["app/actions/", "Server Actions", "Logica de negocio y acceso a BD (21 archivos)"],
        ["app/api/", "API Routes", "Endpoints REST (cron, email)"],
        ["components/", "Componentes React", "UI reutilizable (116 componentes)"],
        ["components/ui/", "Primitivos UI", "56 componentes base (Shadcn/Radix)"],
        ["components/admin/", "Componentes admin", "60 componentes de negocio"],
        ["contexts/", "Context Providers", "Estado global (cotizaciones)"],
        ["hooks/", "Hooks personalizados", "use-toast, use-mobile"],
        ["lib/", "Utilidades", "Supabase, email, encriptacion, integraciones"],
        ["types/", "Definiciones TS", "14 archivos de tipos por dominio"],
        ["public/", "Assets estaticos", "Imagenes, logos, fuentes"],
        ["styles/", "Estilos CSS", "Tailwind globals"],
      ]),

      para(""),
      heading("4.2 Flujo de Autenticacion", HeadingLevel.HEADING_2),
      para("El sistema utiliza autenticacion personalizada basada en cookies encriptadas:"),
      bullet("1. Usuario envia credenciales (email/usuario + contrasena)"),
      bullet("2. Server Action consulta tabla 'usuarios' en Supabase"),
      bullet("3. Comparacion de hash con bcryptjs"),
      bullet("4. Se genera string de sesion con datos del usuario (ID, rol, hoteles)"),
      bullet("5. Se encripta con AES (CryptoJS) usando ENCRYPTION_KEY"),
      bullet("6. Se almacena en cookie HTTP-only segura (duracion: 24 horas)"),
      bullet("7. Rutas protegidas validan cookie en cada request via layout"),
      bullet("8. Sesion invalida redirige a /auth/login"),

      pageBreak(),

      // ── 5. MODULOS FUNCIONALES ──
      heading("5. Modulos Funcionales"),

      heading("5.1 Autenticacion y Usuarios", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["loginUser()", "auth.ts", "Login con validacion bcrypt y asignacion de rol"],
        ["crearSesion()", "session.ts", "Genera sesion encriptada AES"],
        ["obtenerSesion()", "session.ts", "Desencripta y valida cookie de sesion"],
        ["crearUsuario()", "usuarios.ts", "Alta de usuario con hash de contrasena"],
        ["resetPasswordUsuario()", "usuarios.ts", "Restablecimiento de contrasena"],
        ["createAdminUser()", "setup-admin.ts", "Configuracion inicial del administrador"],
      ]),

      para(""),
      heading("5.2 Gestion de Clientes", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["crearCliente()", "clientes.ts", "Alta de cliente"],
        ["obtenerClientes()", "clientes.ts", "Lista de clientes con filtros"],
        ["actualizarCliente()", "clientes.ts", "Edicion de datos de cliente"],
        ["listaDesplegableClientes()", "clientes.ts", "Dropdown de clientes para formularios"],
      ]),

      para(""),
      heading("5.3 Cotizaciones", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["crearCotizacion()", "cotizaciones.ts", "Nueva cotizacion de evento/banquete"],
        ["obtenerCotizaciones()", "cotizaciones.ts", "Listado con filtros y paginacion"],
        ["actualizarCotizacion()", "cotizaciones.ts", "Modificacion de cotizacion existente"],
        ["listaEstatusCotizacion()", "cotizaciones.ts", "Catalogo de estados de cotizacion"],
        ["obtenerDocumentoPDF()", "pdf.ts", "Generacion de PDF de cotizacion multi-pagina"],
        ["enviarCotizacionPorEmail()", "email/send-email.ts", "Envio de cotizacion por correo con PDF adjunto"],
      ]),

      para(""),
      heading("5.4 Reservaciones", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["crearReservacion()", "reservaciones.ts", "Nueva reservacion de salon/habitacion"],
        ["confirmarReservacion()", "reservaciones.ts", "Confirmar reservacion pendiente"],
        ["actualizarEstadosVencidos()", "reservaciones.ts", "Liberar reservaciones expiradas"],
        ["obtenerDisponibilidadSalon()", "reservaciones.ts", "Consulta disponibilidad via vista"],
        ["obtenerReservacionesPorDia()", "reservaciones.ts", "Reservaciones filtradas por fecha"],
      ]),

      para(""),
      heading("5.5 Salones y Espacios", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["crearSalon()", "salones.ts", "Alta de salon/espacio para eventos"],
        ["actualizarSalon()", "salones.ts", "Edicion de salon con imagenes"],
        ["eliminarArchivoSalon()", "salones.ts", "Eliminar imagen de salon del bucket"],
      ]),

      para(""),
      heading("5.6 Hoteles y Habitaciones", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["crearHotel()", "hoteles.ts", "Alta de hotel"],
        ["crearHabitacion()", "habitaciones.ts", "Alta de habitacion"],
        ["actualizarHabitacion()", "habitaciones.ts", "Edicion de habitacion"],
        ["eliminarHabitacion()", "habitaciones.ts", "Baja de habitacion"],
        ["ddlHotelesHabitaciones()", "habitaciones.ts", "Dropdown hoteles para formularios"],
      ]),

      para(""),
      heading("5.7 Menus y Paquetes", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["crearCategoriaMenu()", "menus.ts", "Alta de categoria de menu"],
        ["crearItemMenu()", "menus.ts", "Alta de platillo/item"],
        ["crearPaquete()", "paquetes.ts", "Alta de paquete de banquete"],
        ["actualizarPaquete()", "paquetes.ts", "Edicion de paquete"],
        ["buscarPlatillosItems()", "catalogos.ts", "Busqueda de platillos por nombre"],
      ]),

      para(""),
      heading("5.8 CRM", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["obtenerDashboardCRM()", "crm.ts", "Dashboard con KPIs y metricas"],
        ["obtenerPipeline()", "crm.ts", "Pipeline de ventas por etapa"],
        ["crearActividad()", "crm.ts", "Registrar actividad de seguimiento"],
        ["completarActividad()", "crm.ts", "Marcar actividad como completada"],
        ["obtenerCliente360()", "crm.ts", "Vista 360 del cliente"],
      ]),

      para(""),
      heading("5.9 Convenios y Pagos", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["crearConvenio()", "convenios.ts", "Alta de convenio corporativo"],
        ["actualizarConvenio()", "convenios.ts", "Edicion de convenio"],
        ["confirmarPago()", "pagos.ts", "Confirmar pago recibido"],
        ["eliminarComprobantePago()", "pagos.ts", "Eliminar comprobante de pago"],
      ]),

      para(""),
      heading("5.10 Calendario y Recordatorios", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["crearCalendario()", "calendario.ts", "Crear evento en calendario"],
        ["obtenerCalendarios()", "calendario.ts", "Listar eventos"],
        ["obtenerEventosPorDia()", "calendario.ts", "Eventos filtrados por dia"],
        ["enviarRecordatorio()", "recordatorios.ts", "Enviar notificacion de recordatorio"],
      ]),

      para(""),
      heading("5.11 Utilidades y Seguridad", HeadingLevel.HEADING_2),
      makeTable(["Funcion", "Archivo", "Descripcion"], [
        ["Encrypt()", "utilerias.ts", "Encriptacion AES de datos"],
        ["Desencrypt()", "utilerias.ts", "Desencriptacion AES"],
        ["HashData()", "utilerias.ts", "Hash bcrypt de datos"],
        ["CompareHash()", "utilerias.ts", "Comparacion de hash bcrypt"],
        ["sendEmail()", "lib/email/send-email.ts", "Envio de email HTML via SMTP"],
        ["sendEmailWithAttachment()", "lib/email/send-email.ts", "Email con archivos adjuntos"],
      ]),

      pageBreak(),

      // ── 6. BASE DE DATOS ──
      heading("6. Base de Datos (Supabase / PostgreSQL)"),

      para("El proyecto utiliza Supabase como backend-as-a-service, que provee una instancia de PostgreSQL gestionada con API REST auto-generada, autenticacion, storage de archivos y funciones edge."),
      para(""),

      heading("6.1 Tablas Principales", HeadingLevel.HEADING_2),
      makeTable(["Tabla", "Modulo", "Descripcion"], [
        ["usuarios", "Auth", "Cuentas de usuario del sistema"],
        ["roles", "Auth", "Roles y permisos"],
        ["usuariosxhotel", "Auth", "Relacion usuario-hotel"],
        ["clientes / clients", "Clientes", "Registros de clientes"],
        ["client_contacts", "CRM", "Contactos de clientes"],
        ["client_activities", "CRM", "Actividades de seguimiento"],
        ["cotizaciones", "Ventas", "Cotizaciones de eventos"],
        ["elementosxcotizacion", "Ventas", "Elementos por cotizacion"],
        ["formatocotizaciones", "Ventas", "Plantillas de cotizacion"],
        ["reservaciones", "Reservas", "Reservaciones de salones"],
        ["room_bookings", "Reservas", "Reservaciones de habitaciones"],
        ["salones / event_spaces", "Espacios", "Salones para eventos"],
        ["montajesxsalon", "Espacios", "Configuraciones de montaje"],
        ["hoteles / hotels", "Hoteles", "Informacion de hoteles"],
        ["habitaciones / rooms", "Habitaciones", "Habitaciones individuales"],
        ["room_categories", "Habitaciones", "Categorias de habitacion"],
        ["platillositems", "Menus", "Platillos y items de menu"],
        ["menu_categories", "Menus", "Categorias de menu"],
        ["complementos", "Menus", "Items complementarios"],
        ["audiovisual", "Eventos", "Equipo audiovisual"],
        ["banquet_packages", "Paquetes", "Paquetes de banquete"],
        ["elementosxpaquete", "Paquetes", "Elementos por paquete"],
        ["convenios", "Comercial", "Convenios corporativos"],
        ["empresas", "Comercial", "Empresas/organizaciones"],
        ["paises", "Catalogos", "Paises"],
        ["estados", "Catalogos", "Estados/provincias"],
        ["ciudades", "Catalogos", "Ciudades"],
        ["configuraciones", "Sistema", "Configuracion del sistema"],
        ["tipoevento", "Catalogos", "Tipos de evento"],
        ["notifications", "Sistema", "Notificaciones del sistema"],
      ]),

      para(""),
      heading("6.2 Vistas (Views)", HeadingLevel.HEADING_2),
      makeTable(["Vista", "Descripcion"], [
        ["vw_ocotizaciones", "Vista consolidada de cotizaciones con datos de cliente y salon"],
        ["vw_oclientes", "Vista de clientes con informacion relacionada"],
        ["vw_oreservaciones", "Vista de reservaciones con disponibilidad"],
        ["vw_osalones", "Vista de salones con capacidad y montajes"],
        ["vw_opaquetes", "Vista de paquetes con elementos"],
        ["vw_ohoteles", "Vista de hoteles con configuracion"],
        ["vw_ousuarios", "Vista de usuarios con rol y hotel"],
        ["vw_oconvenios", "Vista de convenios con empresa"],
        ["vw_ocalendarios", "Vista de calendario con eventos"],
        ["vw_elementocotizacion", "Vista de elementos por cotizacion"],
        ["vw_elementopaquete", "Vista de elementos por paquete"],
      ]),

      pageBreak(),

      // ── 7. COMPONENTES UI ──
      heading("7. Componentes de Interfaz"),

      heading("7.1 Componentes Base (Shadcn/UI) — 56", HeadingLevel.HEADING_2),
      para("Componentes primitivos reutilizables basados en Radix UI: Button, Input, Dialog, Card, Table, Form, Select, Dropdown, Tabs, Accordion, Alert, Avatar, Badge, Calendar, Carousel, Checkbox, Collapsible, Command, ContextMenu, Drawer, HoverCard, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, ScrollArea, Separator, Sheet, Sidebar, Skeleton, Slider, Switch, Textarea, Toast, Toggle, Tooltip, y mas."),

      para(""),
      heading("7.2 Componentes de Negocio — 60", HeadingLevel.HEADING_2),
      makeTable(["Modulo", "Componentes", "Descripcion"], [
        ["Cotizaciones", "9", "Formulario, editor, filtros, tabla, resumen"],
        ["CRM", "6", "Dashboard, pipeline, actividades, cliente 360"],
        ["Paquetes", "5", "Formulario, tabla, vista de paquete"],
        ["Clientes", "5", "Contactos, notas, filtros, tabla"],
        ["Configuracion", "4", "Paneles de config general, hoteles, sistema"],
        ["Menus", "4", "Categorias, items, formularios"],
        ["Calendario", "4", "Grid, filtro, sidebar, detalle de dia"],
        ["Salones", "3", "Tarjetas, filtros, formulario"],
        ["Reservaciones", "3", "Formulario, tabla, filtro"],
        ["Convenios", "3", "Formulario, tabla, detalle"],
        ["Habitaciones", "2", "Tabla, formulario"],
        ["Categorias Hab.", "2", "Formulario, tabla"],
        ["Hoteles", "2", "Formulario, gestion"],
        ["Espacios", "2", "Formulario, display"],
        ["Admin base", "2", "Sidebar, header"],
        ["Landing", "3", "Landing content, slider salones, tema"],
      ]),

      pageBreak(),

      // ── 8. RUTAS Y NAVEGACION ──
      heading("8. Mapa de Rutas (54 rutas)"),

      heading("8.1 Rutas Publicas", HeadingLevel.HEADING_2),
      makeTable(["Ruta", "Descripcion"], [
        ["/", "Pagina de inicio / landing"],
        ["/auth/login", "Inicio de sesion"],
        ["/auth/sign-up", "Registro de usuario"],
        ["/auth/forgot-password", "Recuperacion de contrasena"],
        ["/auth/error", "Error de autenticacion"],
        ["/landing", "Landing page publica"],
        ["/landing/landingsalones", "Landing de salones"],
      ]),

      para(""),
      heading("8.2 Rutas Protegidas (requieren autenticacion)", HeadingLevel.HEADING_2),
      makeTable(["Seccion", "Rutas", "Operaciones"], [
        ["Dashboard", "/dashboard", "Vista general con metricas"],
        ["Clientes", "/clientes, /[id], /[id]/edit, /new", "CRUD completo"],
        ["Cotizaciones", "/cotizaciones, /[id], /edit, /new, /resumen", "CRUD + PDF + email"],
        ["Reservaciones", "/reservaciones, /[id], /[id]/edit, /new", "CRUD + disponibilidad"],
        ["Salones", "/salones, /[id], /[id]/editar, /new", "CRUD + imagenes"],
        ["Hoteles", "/hoteles, /[id], /new", "CRUD"],
        ["Habitaciones", "/habitaciones, /[id], /new", "CRUD + categorias"],
        ["Menus", "/menus, /categories/*, /items/*", "CRUD categorias e items"],
        ["Paquetes", "/packages, /[id], /new", "CRUD paquetes"],
        ["Convenios", "/agreements, /[id], /[id]/edit, /new", "CRUD convenios"],
        ["CRM", "/crm, /pipeline, /actividades, /clientes/[id]", "Dashboard + pipeline + 360"],
        ["Calendario", "Integrado en reservaciones", "Vista dia/semana/mes"],
        ["Reportes", "/reportes", "Generacion de reportes"],
        ["Configuracion", "/configuraciones", "Ajustes del sistema"],
        ["Admin", "/admin", "Panel de administracion"],
      ]),

      pageBreak(),

      // ── 9. INTEGRACIONES ──
      heading("9. Integraciones Externas"),

      makeTable(["Servicio", "Archivo", "Proposito"], [
        ["Supabase", "lib/supabase/", "Base de datos, auth, storage de archivos"],
        ["Vercel", "Deployment", "Hosting, CI/CD, analytics, dominio"],
        ["SMTP (Gmail)", "lib/email/send-email.ts", "Envio de correos (cotizaciones, recordatorios)"],
        ["Pipedrive", "lib/integrations/pipedrive.ts", "Integracion CRM externo"],
        ["WhatsApp", "lib/integrations/whatsapp.ts", "Mensajeria con clientes"],
        ["Cron Job", "api/cron/liberar-fechas", "Liberacion automatica de fechas vencidas"],
      ]),

      pageBreak(),

      // ── 10. VARIABLES DE ENTORNO ──
      heading("10. Variables de Entorno"),

      makeTable(["Variable", "Tipo", "Descripcion"], [
        ["NEXT_PUBLIC_SUPABASE_URL", "Publica", "URL del proyecto Supabase"],
        ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Publica", "Llave anonima de Supabase"],
        ["SUPABASE_SERVICE_ROLE_KEY", "Secreta", "Llave admin de Supabase (server-side)"],
        ["ENCRYPTION_KEY", "Secreta", "Llave AES para encriptacion de sesiones"],
        ["SMTP_HOST", "Secreta", "Servidor SMTP (default: smtp.gmail.com)"],
        ["SMTP_PORT", "Secreta", "Puerto SMTP (default: 587)"],
        ["SMTP_USER", "Secreta", "Usuario de email SMTP"],
        ["SMTP_PASS", "Secreta", "Contrasena/app password SMTP"],
        ["ADMIN_SETUP_EMAIL", "Secreta", "Email del admin inicial"],
        ["ADMIN_SETUP_PASSWORD", "Secreta", "Contrasena del admin inicial"],
        ["CRON_SECRET", "Secreta", "Token de verificacion para cron jobs"],
        ["NEXT_PUBLIC_APP_URL", "Publica", "URL base de la aplicacion"],
        ["NODE_ENV", "Sistema", "Entorno (development/production)"],
      ]),

      pageBreak(),

      // ── 11. SEGURIDAD ──
      heading("11. Seguridad"),

      bullet("Contrasenas hasheadas con bcryptjs (nunca se almacenan en texto plano)"),
      bullet("Sesiones encriptadas con AES-256 (CryptoJS)"),
      bullet("Cookies HTTP-only y Secure (no accesibles desde JavaScript del cliente)"),
      bullet("Expiracion de sesion: 24 horas"),
      bullet("Rutas protegidas por layout con validacion de sesion en cada request"),
      bullet("Server Actions ejecutan en servidor (credenciales nunca expuestas al cliente)"),
      bullet("Supabase Row Level Security (RLS) disponible para control granular"),
      bullet("Variables sensibles en .env.local (no versionadas en Git)"),
      bullet("CRON_SECRET para proteger endpoints de cron jobs"),

      pageBreak(),

      // ── 12. DEPLOYMENT ──
      heading("12. Deployment y Produccion"),

      boldPara("URL de produccion: ", "https://comercial-banquetes-habitaciones.vercel.app"),
      boldPara("Plataforma: ", "Vercel (deploy automatico desde GitHub)"),
      boldPara("Branch de produccion: ", "main"),
      boldPara("Bundler: ", "Turbopack (desarrollo) / Webpack (produccion)"),
      boldPara("Gestor de paquetes: ", "pnpm v10.30.3"),
      para(""),
      para("El deploy se realiza automaticamente al hacer push a la rama main en GitHub, o manualmente con: vercel deploy --prod --yes"),
    ],
  }],
});

// ── Generate ─────────────────────────────────────────────────────────────────
const buffer = await Packer.toBuffer(doc);
writeFileSync("C:/claude/projects/spark/.reports/SPARK-Reporte-Tecnico.docx", buffer);
console.log("Reporte generado: .reports/SPARK-Reporte-Tecnico.docx");
