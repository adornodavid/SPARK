import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType, PageBreak
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

const boldBullet = (label, value, level = 0) =>
  new Paragraph({ bullet: { level }, spacing: { after: 40 }, children: [new TextRun({ text: label, bold: true }), new TextRun(value)] });

const cellShading = { type: ShadingType.SOLID, color: "1a1a2e", fill: "1a1a2e" };
const headerCell = (text) => new TableCell({
  shading: cellShading,
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20 })] })],
});
const cell = (text) => new TableCell({
  children: [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text, size: 20 })] })],
});
const boldCell = (text) => new TableCell({
  children: [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text, size: 20, bold: true })] })],
});

// Status cell with color coding
const greenShading = { type: ShadingType.SOLID, color: "d4edda", fill: "d4edda" };
const yellowShading = { type: ShadingType.SOLID, color: "fff3cd", fill: "fff3cd" };
const redShading = { type: ShadingType.SOLID, color: "f8d7da", fill: "f8d7da" };

const statusCell = (status) => {
  const shading = status === "Completado" ? greenShading : status === "En proceso" ? yellowShading : redShading;
  const color = status === "Completado" ? "155724" : status === "En proceso" ? "856404" : "721c24";
  return new TableCell({
    shading,
    children: [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: status, size: 20, bold: true, color })] })],
  });
};

const makeTable = (headers, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: headers.map(h => headerCell(h)) }),
    ...rows.map(r => new TableRow({ children: r.map((c, i) => i === 0 ? boldCell(c) : cell(c)) })),
  ],
});

const simpleTable = (headers, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: headers.map(h => headerCell(h)) }),
    ...rows.map(r => new TableRow({ children: r.map(c => cell(c)) })),
  ],
});

// Table with status column (last column is status with color)
const statusTable = (headers, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: headers.map(h => headerCell(h)) }),
    ...rows.map(r => new TableRow({
      children: r.map((c, i) => {
        if (i === 0) return boldCell(c);
        if (i === r.length - 1) return statusCell(c);
        return cell(c);
      }),
    })),
  ],
});

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const spacer = () => new Paragraph({ spacing: { after: 120 } });

// Status tag inline
const statusTag = (status) => {
  const color = status === "Completado" ? "155724" : status === "En proceso" ? "856404" : "721c24";
  return new TextRun({ text: `  [${status}]`, bold: true, color, size: 22 });
};

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

      // ══════════════════════════════════════════════════════════════════════
      // PORTADA
      // ══════════════════════════════════════════════════════════════════════
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
        spacing: { after: 200 },
        children: [new TextRun({ text: "Herramientas del Sistema", size: 36, color: "1a1a2e", bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "Milenium Grupo Hotelero Mexicano", size: 26, color: "888888" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Fecha: 11 de Marzo de 2026", size: 24, color: "999999" })],
      }),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // 1. CONTEXTO Y OBJETIVO
      // ══════════════════════════════════════════════════════════════════════
      heading("1. Contexto y Objetivo del Sistema"),

      para("SPARK es un sistema web desarrollado para Milenium Grupo Hotelero Mexicano con la finalidad de agilizar y ayudar en la gestion de eventos de Banquetes de cada hotel perteneciente al grupo."),
      spacer(),

      heading("1.1 Objetivos principales", HeadingLevel.HEADING_2),
      bullet("Conocer y gestionar la disponibilidad de Salones de cada hotel"),
      bullet("Dar una respuesta rapida al cliente, generando una cotizacion digital"),
      bullet("Centralizar la gestion de catalogos, clientes, convenios y paquetes"),
      bullet("Proveer herramientas de CRM para seguimiento comercial"),
      bullet("Permitir la administracion multipropiedad (varios hoteles) desde una sola plataforma"),

      spacer(),
      heading("1.2 Usuarios del sistema", HeadingLevel.HEADING_2),
      makeTable(["Tipo de Usuario", "Acceso", "Descripcion"], [
        ["Administrador", "Ruta Administrativa + Ruta Principal", "Acceso completo al sistema. Puede gestionar usuarios, configuraciones, encriptacion y todos los catalogos."],
        ["Vendedor", "Ruta Principal (1 hotel)", "Acceso a las herramientas comerciales de un solo hotel. Su contenido se filtra por su variable de sesion HotelId."],
        ["Vendedor Multipropiedad", "Ruta Principal (varios hoteles)", "Acceso a las herramientas comerciales de multiples hoteles asignados a su cuenta."],
      ]),

      spacer(),
      heading("1.3 Simbologia de estatus", HeadingLevel.HEADING_2),
      para("Cada herramienta del sistema cuenta con una indicacion de su estado de desarrollo:"),
      spacer(),
      statusTable(["Estatus", "Significado"], [
        ["Completado", "La herramienta esta implementada, funcional y conectada a la base de datos. Lista para uso en produccion."],
        ["En proceso", "La herramienta tiene implementacion parcial. Puede tener pagina, acciones de servidor o interfaz incompletas. Requiere trabajo adicional."],
        ["No iniciado", "La herramienta esta planeada pero aun no cuenta con implementacion en el codigo."],
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // 2. MAPA GENERAL CON ESTATUS
      // ══════════════════════════════════════════════════════════════════════
      heading("2. Mapa General de Herramientas con Estatus"),

      para("El sistema SPARK se divide en dos rutas de acceso, cada una con herramientas especificas. A continuacion se presenta el estado de desarrollo de cada una:"),
      spacer(),

      statusTable(["#", "Herramienta", "Ruta", "Estatus"], [
        ["1", "Gestion de Usuarios", "Administrativa", "Completado"],
        ["2", "HASH y Encriptacion", "Administrativa", "Completado"],
        ["3", "Configuraciones del Sistema", "Administrativa", "Completado"],
        ["4", "Dashboard / Calendario", "Principal", "Completado"],
        ["5", "Catalogo de Hoteles", "Principal", "Completado"],
        ["6", "Catalogo de Salones", "Principal", "Completado"],
        ["7", "Catalogo de Montajes", "Principal", "En proceso"],
        ["8", "Catalogo de Clientes", "Principal", "En proceso"],
        ["9", "Catalogo de Empresas", "Principal", "Completado"],
        ["10", "Catalogo de Platillos", "Principal", "Completado"],
        ["11", "Catalogo de Bebidas", "Principal", "En proceso"],
        ["12", "Catalogo de Mobiliario", "Principal", "En proceso"],
        ["13", "Catalogo de Audiovisuales", "Principal", "En proceso"],
        ["14", "Catalogo de Convenios", "Principal", "Completado"],
        ["15", "Catalogo de Cortesias", "Principal", "No iniciado"],
        ["16", "Catalogo de Paquetes", "Principal", "Completado"],
        ["17", "Cotizaciones", "Principal", "Completado"],
        ["18", "Generacion de PDF", "Principal", "Completado"],
        ["19", "Envio de cotizacion por email", "Principal", "Completado"],
        ["20", "Reservaciones", "Principal", "En proceso"],
        ["21", "CRM - Dashboard", "Principal", "Completado"],
        ["22", "CRM - Pipeline", "Principal", "Completado"],
        ["23", "CRM - Actividades", "Principal", "Completado"],
        ["24", "CRM - Vista Cliente 360", "Principal", "Completado"],
        ["25", "Integracion Pipedrive", "Principal", "No iniciado"],
      ]),

      spacer(),
      boldPara("Resumen: ", "15 Completadas | 8 En proceso | 2 No iniciadas"),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // 3. RUTA ADMINISTRATIVA
      // ══════════════════════════════════════════════════════════════════════
      heading("3. Ruta Administrativa (Solo Administradores)"),

      para("La ruta administrativa esta disponible unicamente para usuarios con rol de Administrador. Contiene herramientas de configuracion y mantenimiento del sistema."),
      spacer(),

      // 3.1 Gestion de Usuarios
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [
        new TextRun({ text: "3.1 Gestion de Usuarios", bold: true }),
        statusTag("Completado"),
      ]}),

      boldPara("Descripcion: ", "Herramienta para administrar las cuentas de acceso al sistema. Permite controlar quien tiene acceso, con que rol y a que hoteles."),
      spacer(),

      makeTable(["Operacion", "Descripcion"], [
        ["Crear usuario", "Alta de un nuevo usuario con asignacion de nombre, email, contrasena, rol (Administrador, Vendedor, Vendedor Multipropiedad) y hotel(es) asociado(s). La contrasena se almacena hasheada con bcrypt."],
        ["Editar usuario", "Modificacion de datos del usuario: nombre, email, rol, hoteles asignados, estado activo/inactivo."],
        ["Eliminar usuario", "Baja logica o eliminacion de la cuenta de usuario del sistema."],
        ["Resetear contrasena", "Permite al administrador restablecer la contrasena de cualquier usuario."],
      ]),

      spacer(),
      para("Datos gestionados por usuario:"),
      bullet("Nombre completo"),
      bullet("Email / Usuario de acceso"),
      bullet("Contrasena (almacenada como hash bcrypt)"),
      bullet("Rol asignado (define permisos y alcance)"),
      bullet("Hotel(es) asociado(s) (define que contenido puede ver)"),
      bullet("Estado activo/inactivo"),
      bullet("Fecha de ultimo ingreso"),

      spacer(),

      // 3.2 HASH y Encriptacion
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [
        new TextRun({ text: "3.2 HASH y Encriptacion", bold: true }),
        statusTag("Completado"),
      ]}),

      boldPara("Descripcion: ", "Herramientas utilitarias para que el administrador pueda hashear texto y encriptar/desencriptar informacion de forma manual. Utiles para operaciones de mantenimiento, verificacion de datos y soporte tecnico."),
      spacer(),

      makeTable(["Herramienta", "Descripcion"], [
        ["Hashear texto", "Genera un hash bcrypt a partir de un texto ingresado. Util para generar o verificar contrasenas manualmente."],
        ["Encriptar texto", "Cifra un texto utilizando el algoritmo AES con la llave de encriptacion del sistema (ENCRYPTION_KEY). Produce un texto cifrado que solo puede ser leido con la misma llave."],
        ["Desencriptar texto", "Descifra un texto previamente encriptado con AES. Permite al administrador leer datos cifrados para verificacion o soporte."],
      ]),

      spacer(),

      // 3.3 Configuraciones
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [
        new TextRun({ text: "3.3 Configuraciones del Sistema", bold: true }),
        statusTag("Completado"),
      ]}),

      boldPara("Descripcion: ", "Herramienta para gestionar configuraciones especiales del sistema. Estas configuraciones se almacenan en la tabla 'configuraciones' de la base de datos y controlan comportamientos dinamicos de la aplicacion."),
      spacer(),

      makeTable(["Operacion", "Descripcion"], [
        ["Crear configuracion", "Alta de una nueva configuracion con clave, valor y descripcion. Permite agregar parametros que controlan el comportamiento del sistema sin modificar codigo."],
        ["Editar configuracion", "Modificacion del valor de una configuracion existente. Cambios se reflejan en tiempo real en el sistema."],
        ["Eliminar configuracion", "Baja de una configuracion que ya no es necesaria."],
      ]),

      spacer(),
      para("Ejemplo de configuraciones: parametros de formato de cotizacion, textos personalizables, limites del sistema, configuraciones por hotel, etc."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // 4. RUTA PRINCIPAL
      // ══════════════════════════════════════════════════════════════════════
      heading("4. Ruta Principal (Todos los Usuarios)"),

      para("La ruta principal es el area de trabajo diaria de los usuarios del sistema. Contiene todas las herramientas comerciales y operativas para la gestion de eventos y banquetes. El contenido visible depende del HotelId y del rol del usuario en sesion."),
      spacer(),

      // 4.1 Dashboard
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [
        new TextRun({ text: "4.1 Dashboard — Calendario y Disponibilidad", bold: true }),
        statusTag("Completado"),
      ]}),

      boldPara("Descripcion: ", "Pantalla principal del sistema que muestra un calendario interactivo con la disponibilidad y estatus de eventos y salones. Permite al usuario tener una vision general de la operacion del hotel."),
      spacer(),

      para("Funcionalidades:"),
      bullet("Calendario interactivo con vista de dia, semana y mes"),
      bullet("Visualizacion de disponibilidad de salones en tiempo real"),
      bullet("Estatus de eventos (confirmado, pendiente, cancelado) con codigo de colores"),
      bullet("Filtrado por salon, fecha y tipo de evento"),
      bullet("Navegacion rapida a detalle de evento o cotizacion"),
      bullet("Vista adaptada al hotel del usuario (segun HotelId en sesion)"),

      spacer(),

      // 4.2 Catalogos
      heading("4.2 Gestion de Catalogos", HeadingLevel.HEADING_2),

      boldPara("Descripcion: ", "Conjunto de herramientas para administrar toda la informacion base que alimenta al sistema. Cada catalogo tiene su pagina de listado con busqueda y sus opciones de Crear y Editar."),
      spacer(),

      statusTable(["Catalogo", "Operaciones", "Descripcion", "Estatus"], [
        ["Hoteles", "Listar, Crear, Editar", "Registro de cada hotel del grupo. Incluye nombre, direccion, datos de contacto, logo e imagen. Base para filtrar contenido por propiedad.", "Completado"],
        ["Salones", "Listar, Crear, Editar", "Espacios para eventos de cada hotel. Incluye nombre, capacidad minima/maxima, tipos de montaje disponibles, imagenes y ubicacion dentro del hotel.", "Completado"],
        ["Montajes", "Listar, Crear, Editar", "Configuraciones de disposicion de un salon (teatro, banquete, escuela, coctel, etc.). Actualmente integrado como sub-funcion dentro de Salones, sin pagina independiente.", "En proceso"],
        ["Clientes", "Listar, Crear, Editar", "Registro de clientes que solicitan eventos. Server actions implementados y funcionales. La interfaz de usuario muestra datos de prueba en lugar de datos reales de la base de datos.", "En proceso"],
        ["Empresas", "Listar, Crear, Editar", "Organizaciones/empresas que contratan eventos. Integrado dentro del modulo de Clientes como tipo de cliente. Funcional.", "Completado"],
        ["Platillos", "Listar, Crear, Editar", "Items del menu de alimentos disponibles para eventos. Incluye nombre, descripcion, precio, categoria y documento PDF con imagen/ficha del platillo.", "Completado"],
        ["Bebidas", "Listar, Crear, Editar", "Catalogo de bebidas disponibles para eventos. Integrado dentro del modulo de Menus por categoria. No cuenta con pagina independiente dedicada.", "En proceso"],
        ["Mobiliario", "Listar, Crear, Editar", "Muebles y equipo adicional disponible para eventos. No cuenta con pagina, server actions ni interfaz implementados.", "En proceso"],
        ["Audiovisuales", "Listar, Crear, Editar", "Equipo audiovisual disponible (pantallas, proyectores, microfonos). No cuenta con pagina, server actions ni interfaz implementados.", "En proceso"],
        ["Convenios", "Listar, Crear, Editar", "Acuerdos corporativos con empresas que establecen tarifas preferenciales, condiciones especiales y vigencia.", "Completado"],
        ["Cortesias", "Listar, Crear, Editar", "Items de cortesia que se pueden incluir en cotizaciones sin costo adicional. No cuenta con implementacion en el codigo.", "No iniciado"],
        ["Paquetes", "Listar, Crear, Editar", "Paquetes prearmados de banquete que agrupan platillos, bebidas, mobiliario y servicios con un precio por persona.", "Completado"],
      ]),

      spacer(),
      para("Nota: Cada catalogo muestra unicamente los registros correspondientes al hotel (o hoteles) del usuario en sesion, segun su variable HotelId."),

      pageBreak(),

      // 4.3 Cotizaciones
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [
        new TextRun({ text: "4.3 Cotizaciones", bold: true }),
        statusTag("Completado"),
      ]}),

      boldPara("Descripcion: ", "Herramienta central del sistema que permite generar cotizaciones digitales de eventos de banquetes de forma rapida y profesional. Cumple directamente con el objetivo principal: dar una respuesta rapida al cliente."),
      spacer(),

      heading("Operaciones disponibles:", HeadingLevel.HEADING_3),
      spacer(),

      makeTable(["Operacion", "Descripcion"], [
        ["Listado y busqueda", "Pagina principal de cotizaciones con tabla filtrable por estatus, fecha, cliente, salon. Permite busqueda rapida por numero de cotizacion o nombre de cliente."],
        ["Crear cotizacion", "Formulario completo para generar una nueva cotizacion. Incluye seleccion de cliente, salon, fecha del evento, numero de invitados, seleccion de alimentos (con preview PDF), bebidas, mobiliario, audiovisual, cortesias y paquetes."],
        ["Editar cotizacion", "Modificacion de una cotizacion existente con todos los campos disponibles para actualizacion."],
      ]),

      spacer(),
      heading("Detalle del formulario de cotizacion:", HeadingLevel.HEADING_3),
      spacer(),

      para("El formulario de creacion/edicion de cotizacion incluye las siguientes secciones:"),
      bullet("Datos generales: Cliente, empresa, tipo de evento, fecha, salon, montaje"),
      bullet("Numero de invitados: Se auto-llena con la capacidad minima del salon seleccionado"),
      bullet("Subseccion Alimentos (Platillos): Seleccion de platillos desde el catalogo con preview de PDF/imagen inline en modal"),
      bullet("Subseccion Bebidas: Seleccion de bebidas del catalogo"),
      bullet("Subseccion Complementos: Mobiliario, audiovisual y servicios adicionales con vista de PDF/imagen"),
      bullet("Subseccion Cortesias: Items de cortesia sin costo"),
      bullet("Subseccion Paquetes: Seleccion de paquetes prearmados"),
      bullet("Requerimiento de Habitaciones: Checkbox que habilita campos para cantidad de habitaciones, tipo y noches"),
      bullet("Presupuesto: Calculo automatico de costos por seccion"),
      bullet("Confirmacion: Modal de confirmacion antes de guardar"),

      spacer(),

      // PDF
      new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 }, children: [
        new TextRun({ text: "Generacion de PDF:", bold: true }),
        statusTag("Completado"),
      ]}),
      spacer(),
      para("Desde la cotizacion creada o editada se puede generar un documento PDF profesional multi-pagina que incluye:"),
      bullet("Datos del hotel y logotipo"),
      bullet("Datos del cliente y empresa/grupo"),
      bullet("Informacion del evento (fecha, salon, montaje, invitados)"),
      bullet("Desglose de alimentos, bebidas, complementos y cortesias"),
      bullet("Seccion de audiovisuales"),
      bullet("Presupuesto total desglosado"),
      bullet("Terminos y condiciones"),

      spacer(),

      // Email
      new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 }, children: [
        new TextRun({ text: "Envio por correo electronico:", bold: true }),
        statusTag("Completado"),
      ]}),
      spacer(),
      para("La cotizacion en PDF puede ser enviada directamente por correo electronico al cliente desde el sistema, utilizando el servidor SMTP configurado. El correo incluye:"),
      bullet("Asunto personalizado con numero de cotizacion"),
      bullet("Cuerpo HTML con resumen del evento"),
      bullet("PDF de la cotizacion como archivo adjunto"),

      pageBreak(),

      // 4.4 Dashboard CRM
      heading("4.4 CRM — Gestion de Relacion con Clientes", HeadingLevel.HEADING_2),

      boldPara("Descripcion: ", "Modulo de CRM integrado disenado para sustituir o trabajar en conjunto con Pipedrive utilizando su API. Provee herramientas de seguimiento comercial para el equipo de ventas."),
      spacer(),

      statusTable(["Herramienta CRM", "Descripcion", "Estatus"], [
        ["Dashboard CRM", "Vista general con indicadores clave (KPIs): cotizaciones activas, tasa de conversion, ingresos proyectados, actividades pendientes. Graficas de rendimiento.", "Completado"],
        ["Pipeline de ventas", "Tablero visual tipo Kanban con las etapas del proceso de venta (prospecto, contactado, cotizado, negociacion, confirmado, perdido). Permite arrastrar oportunidades entre etapas.", "Completado"],
        ["Actividades", "Registro y seguimiento de actividades de venta: llamadas, correos, visitas, seguimientos. Permite crear, completar y consultar actividades con fechas y asignacion.", "Completado"],
        ["Vista Cliente 360", "Pagina de detalle del cliente con toda su informacion consolidada: datos personales, empresa, historial de cotizaciones, eventos realizados, actividades de seguimiento, notas y documentos.", "Completado"],
        ["Integracion Pipedrive", "Conexion con la API de Pipedrive para sincronizar contactos, deals y actividades. Actualmente solo existe la estructura base con funciones placeholder. Requiere implementacion de la API real.", "No iniciado"],
      ]),

      pageBreak(),

      // 4.5 Calendario y Disponibilidad
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [
        new TextRun({ text: "4.5 Calendario y Disponibilidad de Salones", bold: true }),
        statusTag("Completado"),
      ]}),

      boldPara("Descripcion: ", "Herramienta que cumple directamente con el primer objetivo del sistema: conocer y gestionar la disponibilidad de salones."),
      spacer(),

      para("Funcionalidades:"),
      bullet("Consulta de disponibilidad de salones por fecha y hora"),
      bullet("Vista de calendario con eventos confirmados, pendientes y bloqueados"),
      bullet("Detalle por dia con lista de eventos y salones ocupados"),
      bullet("Filtro por salon especifico o vista general de todos los salones"),
      bullet("Liberacion automatica de fechas vencidas mediante cron job programado"),
      bullet("Datos alimentados desde la vista vw_oreservaciones de la base de datos"),

      spacer(),

      // 4.6 Reservaciones
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [
        new TextRun({ text: "4.6 Reservaciones", bold: true }),
        statusTag("En proceso"),
      ]}),

      boldPara("Descripcion: ", "Gestion de reservaciones de salones y habitaciones vinculadas a eventos."),
      spacer(),
      para("Nota de desarrollo: Las acciones de servidor (backend) estan implementadas y son funcionales. La interfaz de usuario tiene la estructura completa pero actualmente muestra datos de prueba en lugar de consultar datos reales de la base de datos. Requiere integracion final del frontend con el backend."),
      spacer(),

      makeTable(["Operacion", "Descripcion"], [
        ["Listar reservaciones", "Tabla con todas las reservaciones filtrable por fecha, salon, estatus y cliente."],
        ["Crear reservacion", "Alta de reservacion vinculada a cotizacion/evento con salon, fecha, horario y estatus."],
        ["Editar reservacion", "Modificacion de datos de la reservacion existente."],
        ["Confirmar reservacion", "Cambio de estatus de pendiente a confirmado."],
        ["Liberacion automatica", "Cron job que libera fechas de reservaciones vencidas o no confirmadas."],
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // 5. CONTROL DE ACCESO
      // ══════════════════════════════════════════════════════════════════════
      heading("5. Control de Acceso y Permisos"),

      para("El sistema implementa un control de acceso basado en roles y propiedad hotelera:"),
      spacer(),

      heading("5.1 Variables de sesion", HeadingLevel.HEADING_2),
      para("Al iniciar sesion, se almacenan las siguientes variables en una cookie encriptada:"),
      spacer(),

      simpleTable(["Variable", "Descripcion", "Efecto en el sistema"], [
        ["UsuarioId", "ID unico del usuario", "Identifica al usuario en cada operacion"],
        ["Email", "Correo electronico", "Identificador de acceso"],
        ["NombreCompleto", "Nombre del usuario", "Mostrado en la interfaz"],
        ["RolId", "ID del rol asignado", "Define permisos y rutas accesibles"],
        ["Rol", "Nombre del rol", "Administrador, Vendedor, Vendedor Multipropiedad"],
        ["Hoteles", "ID(s) de hotel(es)", "Filtra todo el contenido visible en el sistema"],
        ["SesionActiva", "Estado de la sesion", "Valida que la sesion este vigente"],
      ]),

      spacer(),
      heading("5.2 Filtrado por HotelId", HeadingLevel.HEADING_2),
      para("Todo el contenido del sistema se filtra automaticamente segun la variable Hoteles de la sesion:"),
      bullet("Un Vendedor con HotelId = 1 solo ve salones, cotizaciones, clientes y eventos del Hotel 1"),
      bullet("Un Vendedor Multipropiedad con Hoteles = [1, 3, 5] ve contenido de los 3 hoteles asignados"),
      bullet("Un Administrador puede ver y gestionar contenido de todos los hoteles"),

      spacer(),
      heading("5.3 Matriz de acceso por rol", HeadingLevel.HEADING_2),
      spacer(),

      simpleTable(["Herramienta", "Administrador", "Vendedor Multipropiedad", "Vendedor"], [
        ["Ruta Administrativa", "Si", "No", "No"],
        ["Gestion de Usuarios", "Si", "No", "No"],
        ["HASH y Encriptacion", "Si", "No", "No"],
        ["Configuraciones", "Si", "No", "No"],
        ["Dashboard / Calendario", "Si (todos los hoteles)", "Si (hoteles asignados)", "Si (1 hotel)"],
        ["Catalogos (todos)", "Si (todos los hoteles)", "Si (hoteles asignados)", "Si (1 hotel)"],
        ["Cotizaciones", "Si (todos los hoteles)", "Si (hoteles asignados)", "Si (1 hotel)"],
        ["Reservaciones", "Si (todos los hoteles)", "Si (hoteles asignados)", "Si (1 hotel)"],
        ["CRM / Pipeline", "Si", "Si", "Si"],
        ["Generar PDF", "Si", "Si", "Si"],
        ["Enviar cotizacion por email", "Si", "Si", "Si"],
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // 6. FLUJOS DE TRABAJO
      // ══════════════════════════════════════════════════════════════════════
      heading("6. Flujos de Trabajo Principales"),

      heading("6.1 Flujo: Cotizacion rapida para cliente", HeadingLevel.HEADING_2),
      para("Escenario: Un cliente llama solicitando informacion para un evento. El vendedor necesita responder rapido."),
      spacer(),
      bullet("1. El vendedor accede al Dashboard y verifica disponibilidad del salon en la fecha solicitada"),
      bullet("2. Desde el menu, accede a Cotizaciones > Crear nueva cotizacion"),
      bullet("3. Selecciona o registra al cliente"),
      bullet("4. Elige salon, fecha, tipo de evento y numero de invitados"),
      bullet("5. Selecciona alimentos del catalogo (con preview PDF de cada platillo)"),
      bullet("6. Agrega bebidas, complementos (mobiliario, audiovisual) y cortesias"),
      bullet("7. Opcionalmente selecciona un paquete prearmado"),
      bullet("8. Si el cliente requiere habitaciones, activa el checkbox y completa los datos"),
      bullet("9. Revisa el presupuesto calculado automaticamente"),
      bullet("10. Confirma y guarda la cotizacion"),
      bullet("11. Genera el PDF de la cotizacion"),
      bullet("12. Envia la cotizacion por correo electronico al cliente"),

      spacer(),
      heading("6.2 Flujo: Gestion de disponibilidad", HeadingLevel.HEADING_2),
      para("Escenario: Se necesita verificar y gestionar la disponibilidad de salones."),
      spacer(),
      bullet("1. Acceder al Dashboard con el calendario"),
      bullet("2. Navegar a la fecha deseada"),
      bullet("3. Visualizar salones disponibles y ocupados (por codigo de color/estatus)"),
      bullet("4. Consultar detalle del dia para ver eventos programados"),
      bullet("5. Si hay disponibilidad, proceder con la cotizacion"),
      bullet("6. Las reservaciones vencidas se liberan automaticamente via cron job"),

      spacer(),
      heading("6.3 Flujo: Seguimiento CRM", HeadingLevel.HEADING_2),
      para("Escenario: Seguimiento comercial de oportunidades de venta."),
      spacer(),
      bullet("1. Acceder al CRM > Pipeline de ventas"),
      bullet("2. Ver oportunidades por etapa (prospecto, contactado, cotizado, etc.)"),
      bullet("3. Registrar actividades de seguimiento (llamadas, correos, visitas)"),
      bullet("4. Consultar Vista 360 del cliente para contexto completo"),
      bullet("5. Mover oportunidades entre etapas del pipeline"),
      bullet("6. Revisar KPIs en el Dashboard CRM"),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // 7. RESUMEN CON ESTATUS
      // ══════════════════════════════════════════════════════════════════════
      heading("7. Resumen de Herramientas con Estatus de Desarrollo"),

      spacer(),
      statusTable(["#", "Herramienta", "Ruta", "Operaciones", "Estatus"], [
        ["1", "Gestion de Usuarios", "Administrativa", "Crear, Editar, Eliminar, Resetear contrasena", "Completado"],
        ["2", "HASH y Encriptacion", "Administrativa", "Hashear, Encriptar, Desencriptar texto", "Completado"],
        ["3", "Configuraciones del Sistema", "Administrativa", "Crear, Editar, Eliminar configuraciones", "Completado"],
        ["4", "Dashboard / Calendario", "Principal", "Visualizar disponibilidad, filtrar por salon/fecha", "Completado"],
        ["5", "Catalogo de Hoteles", "Principal", "Listar, Crear, Editar", "Completado"],
        ["6", "Catalogo de Salones", "Principal", "Listar, Crear, Editar (con imagenes)", "Completado"],
        ["7", "Catalogo de Montajes", "Principal", "Listar, Crear, Editar", "En proceso"],
        ["8", "Catalogo de Clientes", "Principal", "Listar, Crear, Editar", "En proceso"],
        ["9", "Catalogo de Empresas", "Principal", "Listar, Crear, Editar", "Completado"],
        ["10", "Catalogo de Platillos", "Principal", "Listar, Crear, Editar (con PDF)", "Completado"],
        ["11", "Catalogo de Bebidas", "Principal", "Listar, Crear, Editar", "En proceso"],
        ["12", "Catalogo de Mobiliario", "Principal", "Listar, Crear, Editar", "En proceso"],
        ["13", "Catalogo de Audiovisuales", "Principal", "Listar, Crear, Editar", "En proceso"],
        ["14", "Catalogo de Convenios", "Principal", "Listar, Crear, Editar", "Completado"],
        ["15", "Catalogo de Cortesias", "Principal", "Listar, Crear, Editar", "No iniciado"],
        ["16", "Catalogo de Paquetes", "Principal", "Listar, Crear, Editar", "Completado"],
        ["17", "Cotizaciones", "Principal", "Listar, Buscar, Crear, Editar", "Completado"],
        ["18", "Generacion de PDF", "Principal", "Generar PDF multi-pagina de cotizacion", "Completado"],
        ["19", "Envio por email", "Principal", "Enviar PDF adjunto por correo SMTP", "Completado"],
        ["20", "Reservaciones", "Principal", "Listar, Crear, Editar, Confirmar", "En proceso"],
        ["21", "CRM - Dashboard", "Principal", "KPIs, graficas, metricas de venta", "Completado"],
        ["22", "CRM - Pipeline", "Principal", "Tablero Kanban por etapas de venta", "Completado"],
        ["23", "CRM - Actividades", "Principal", "Crear, completar, consultar seguimientos", "Completado"],
        ["24", "CRM - Vista Cliente 360", "Principal", "Historial consolidado del cliente", "Completado"],
        ["25", "Integracion Pipedrive", "Principal", "Sincronizacion via API", "No iniciado"],
      ]),

      spacer(),
      spacer(),
      boldPara("Total de herramientas: ", "25"),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "Completadas: ", bold: true }),
        new TextRun({ text: "15", bold: true, color: "155724" }),
        new TextRun(" — Pagina, servidor y UI funcionando correctamente."),
      ]}),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "En proceso: ", bold: true }),
        new TextRun({ text: "8", bold: true, color: "856404" }),
        new TextRun(" — Implementacion parcial. Requieren completar pagina, integracion de datos o interfaz."),
      ]}),
      new Paragraph({ spacing: { after: 80 }, children: [
        new TextRun({ text: "No iniciadas: ", bold: true }),
        new TextRun({ text: "2", bold: true, color: "721c24" }),
        new TextRun(" — Sin implementacion en el codigo. Pendientes de desarrollo."),
      ]}),

      spacer(),
      heading("Detalle de herramientas En Proceso:", HeadingLevel.HEADING_2),
      spacer(),
      simpleTable(["Herramienta", "Estado actual", "Pendiente para completar"], [
        ["Montajes", "Integrado como sub-funcion de Salones", "Crear pagina independiente con CRUD propio"],
        ["Clientes", "Server actions completos y funcionales", "Conectar interfaz con datos reales de la BD (actualmente muestra datos de prueba)"],
        ["Bebidas", "Integrado dentro de Menus por categoria", "Crear pagina independiente dedicada a bebidas"],
        ["Mobiliario", "No tiene pagina ni server actions", "Crear pagina, server actions e interfaz completa"],
        ["Audiovisuales", "No tiene pagina ni server actions", "Crear pagina, server actions e interfaz completa"],
        ["Reservaciones", "Server actions completos y funcionales", "Conectar interfaz con datos reales de la BD (actualmente muestra datos de prueba)"],
      ]),

      spacer(),
      heading("Detalle de herramientas No Iniciadas:", HeadingLevel.HEADING_2),
      spacer(),
      simpleTable(["Herramienta", "Descripcion", "Requiere"], [
        ["Cortesias", "Catalogo de items de cortesia para cotizaciones", "Crear tabla en BD (si no existe), server actions, pagina con listado y formulario CRUD"],
        ["Integracion Pipedrive", "Sincronizacion con CRM externo Pipedrive", "Implementar llamadas reales a la API de Pipedrive (actualmente solo tiene funciones placeholder que retornan datos falsos)"],
      ]),
    ],
  }],
});

// ── Generate ─────────────────────────────────────────────────────────────────
const buffer = await Packer.toBuffer(doc);
writeFileSync("C:/claude/projects/spark/.reports/HerramientasSPARK.docx", buffer);
console.log("Reporte generado: .reports/HerramientasSPARK.docx");
