import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, HeadingLevel, BorderStyle, AlignmentType, ShadingType
} from "docx";
import { writeFileSync } from "fs";

// Helper: create a bold+colored text run
const bold = (text, color) => new TextRun({ text, bold: true, color: color || "000000", font: "Calibri", size: 22 });
const normal = (text) => new TextRun({ text, font: "Calibri", size: 22 });
const italic = (text) => new TextRun({ text, italics: true, font: "Calibri", size: 22, color: "666666" });

// Helper: heading paragraph
const heading = (text, level) => new Paragraph({ heading: level, children: [new TextRun({ text, bold: true, font: "Calibri" })] });

// Helper: bullet paragraph
const bullet = (texts) => new Paragraph({
  bullet: { level: 0 },
  children: texts.map(t => typeof t === "string" ? normal(t) : t),
  spacing: { after: 60 }
});

// Helper: simple paragraph
const para = (texts, opts) => new Paragraph({
  children: texts.map(t => typeof t === "string" ? normal(t) : t),
  spacing: { after: 120 },
  ...opts
});

// Table helpers
const noBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
};

const headerCell = (text, width) => new TableCell({
  children: [new Paragraph({ children: [bold(text, "FFFFFF")], alignment: AlignmentType.CENTER })],
  width: { size: width, type: WidthType.PERCENTAGE },
  shading: { type: ShadingType.SOLID, color: "2E74B5" },
  borders: noBorders,
});

const cell = (text, width, shading) => new TableCell({
  children: [new Paragraph({ children: [normal(text)], spacing: { after: 40 } })],
  width: { size: width, type: WidthType.PERCENTAGE },
  borders: noBorders,
  ...(shading ? { shading: { type: ShadingType.SOLID, color: shading } } : {}),
});

const statusCell = (text, width) => {
  let color = "000000";
  let bg = undefined;
  if (text.includes("✅") || text === "Existe") { color = "1B7A2B"; bg = "E6F4EA"; }
  else if (text.includes("No implementado") || text.includes("No existe") || text.includes("CERO")) { color = "C62828"; bg = "FDECEA"; }
  else if (text.includes("Parcial") || text.includes("Solo")) { color = "E65100"; bg = "FFF3E0"; }
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, font: "Calibri", size: 22, color, bold: true })], spacing: { after: 40 } })],
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: noBorders,
    ...(bg ? { shading: { type: ShadingType.SOLID, color: bg } } : {}),
  });
};

const makeTable = (headers, rows, widths) => {
  const headerRow = new TableRow({
    children: headers.map((h, i) => headerCell(h, widths[i])),
    tableHeader: true,
  });
  const dataRows = rows.map((row, rIdx) =>
    new TableRow({
      children: row.map((c, i) => {
        if (i === row.length - 1 && headers[i]?.includes("Estado")) return statusCell(c, widths[i]);
        return cell(c, widths[i], rIdx % 2 === 1 ? "F2F7FB" : undefined);
      }),
    })
  );
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};

// ============ DOCUMENT ============

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [{
    properties: {},
    children: [
      // TITLE
      new Paragraph({
        children: [new TextRun({ text: "ANÁLISIS COMPARATIVO", font: "Calibri", size: 36, bold: true, color: "2E74B5" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "SPARK-SPEC.md vs Código Actual del Proyecto", font: "Calibri", size: 28, color: "555555" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Fecha: 18 de Marzo 2026  |  Proyecto: SPARK  |  Branch: OmarBranch (sincronizado con main)", font: "Calibri", size: 20, color: "888888" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      // ===== SECTION 1: MODULOS IMPLEMENTADOS =====
      heading("1. MÓDULOS IMPLEMENTADOS (Coinciden con Spec)", HeadingLevel.HEADING_1),
      para([italic("Todos estos módulos existen tanto en la especificación como en el código desplegado.")]),

      makeTable(
        ["Módulo", "Rutas en App", "Componentes", "Estado"],
        [
          ["Dashboard", "1 ruta", "Página principal con KPIs y calendario", "✅ Existe"],
          ["Login / Auth", "5 rutas (login, sign-up, forgot-password, error, success)", "Autenticación custom bcrypt+AES", "✅ Existe"],
          ["Salones", "4 rutas (lista, nuevo, detalle, editar)", "3 componentes en components/admin/salones/", "✅ Existe"],
          ["Cotizaciones", "7 rutas (lista, new, new-2, edicion, resumen, [id], [id]/edit)", "10 componentes en components/admin/quotations/", "✅ Existe"],
          ["Reservaciones", "4 rutas (lista, nuevo, detalle, editar)", "components/admin/bookings/", "✅ Existe"],
          ["Clientes", "4 rutas (lista, nuevo, detalle, editar)", "components/admin/clients/", "✅ Existe"],
          ["CRM", "4 rutas (dashboard, pipeline, actividades, cliente 360)", "components/admin/crm/", "✅ Existe"],
          ["Paquetes", "3 rutas (lista, nuevo, detalle)", "5 componentes en components/admin/packages/", "✅ Existe"],
          ["Habitaciones", "3 rutas + room-categories (3 rutas)", "components/admin/rooms/", "✅ Existe"],
          ["Menús", "5 rutas (lista, categories CRUD, items CRUD)", "components/admin/menus/", "✅ Existe"],
          ["Convenios", "4 rutas (agreements/)", "components/admin/agreements/", "✅ Existe"],
          ["Configuraciones", "1 ruta", "components/admin/settings/", "✅ Existe"],
          ["Hoteles", "3 rutas", "components/admin/hotels/", "✅ Existe"],
          ["PDF + Email", "actions/pdf.ts + lib/email/ (2 archivos)", "Generación PDF jsPDF + envío SMTP", "✅ Existe"],
          ["Pagos", "actions/pagos.ts", "payment-upload.tsx (drag & drop)", "✅ Existe"],
          ["Landing", "2 rutas (landing + landingsalones)", "Presentación fullscreen para iPad", "✅ Existe"],
          ["Seguridad", "middleware.ts + RLS", "Headers, cookie HttpOnly, CRON_SECRET", "✅ Existe"],
        ],
        [18, 28, 32, 12]
      ),

      para([bold("\nServer Actions: "), normal("La spec define 21 archivos en app/actions/ y el código tiene exactamente 21. ✅")]),

      // ===== SECTION 2: LO QUE FALTA - ALTA PRIORIDAD =====
      heading("2. FEATURES NO IMPLEMENTADAS — PRIORIDAD ALTA", HeadingLevel.HEADING_1),
      para([italic("Estas 8 features están definidas en la spec (§16, §25) pero no existen en el código actual. Afectan directamente la operación del negocio.")]),

      makeTable(
        ["#", "Feature", "Sección Spec", "Estado en Código"],
        [
          ["P1", "Integración Pipedrive bidireccional", "§19, §25.2", "Solo existe 1 archivo genérico (lib/integrations/pipedrive.ts). Faltan: sync, field-mapping, types, webhook receiver. No hay tablas pipedrive_id_map ni pipedrive_sync_log"],
          ["P2", "Salones compuestos (bloqueo cruzado)", "§21, §25.3", "No implementado. No existe salon_padre_id ni tabla salones_composicion. El query de disponibilidad no considera padre/hijos"],
          ["P3", "Horas extra en cotizaciones", "§21, §25.4", "No implementado. No existen campos horas_evento, horas_extra, costo_hora_extra, hora_inicio, hora_fin en cotizaciones"],
          ["P4", "Roles granulares (5 niveles)", "§23, §25.5", "No implementado. No existe lib/auth/permissions.ts, ni tabla permisos_rol, ni campo rol_v2. Todos los usuarios pueden hacer todo"],
          ["P5", "Flujo de empalme y alertas", "§22, §25.6", "No implementado. No existe tabla empalmes. Sin alertas cuando 2 asesores cotizan mismo salón/fecha"],
          ["P6", "Descuentos con autorización", "§22, §25.7", "No implementado. No existe tabla autorizaciones_descuento. Asesores pueden dar descuentos sin aprobación"],
          ["P7", "Validación Zod en server actions", "§25.1", "No existe lib/validations/. Zod está instalado (v3.25.76) pero no se usa en ningún server action"],
          ["P8", "Pricing actualizado (A&B reemplaza renta)", "§20, BD §8", "No implementado. No existen campos renta_salon, costo_ab, ab_reemplaza_renta, porcentaje_descuento"],
        ],
        [5, 22, 10, 53]
      ),

      // Detail for each P item
      heading("Detalle por Feature de Alta Prioridad", HeadingLevel.HEADING_2),

      para([bold("P1 — Integración Pipedrive")]),
      bullet([normal("Estado actual: Solo existe lib/integrations/pipedrive.ts (1 archivo genérico)")]),
      bullet([normal("Archivos que faltan crear: lib/pipedrive/client.ts, lib/pipedrive/field-mapping.ts, lib/pipedrive/types.ts")]),
      bullet([normal("Server actions faltantes: app/actions/pipedrive.ts, app/actions/pipedrive-sync.ts")]),
      bullet([normal("API route faltante: app/api/webhooks/pipedrive/route.ts (webhook receiver)")]),
      bullet([normal("Tablas BD faltantes: pipedrive_id_map, pipedrive_sync_log")]),
      bullet([normal("El equipo comercial ya usa Pipedrive activamente con 83 usuarios y 97 pipelines")]),

      para([bold("\nP2 — Salones Compuestos")]),
      bullet([normal("Impacto CRÍTICO: Reservar un sub-salón (ej. A01) debe bloquear el salón compuesto (Acero) y viceversa")]),
      bullet([normal("Sin esto, la disponibilidad mostrada es incorrecta")]),
      bullet([normal("Requiere: campo salon_padre_id en tabla salones O tabla salones_composicion")]),
      bullet([normal("Modificar: verificarDisponibilidad() en cotizaciones.ts y reservaciones.ts")]),

      para([bold("\nP3 — Horas Extra")]),
      bullet([normal("Fórmula: costo_hora_extra = renta_salon / 8 horas")]),
      bullet([normal("Actualmente la cotización no distingue duración del evento")]),
      bullet([normal("Error en pricing si evento excede 8 horas (no se cobra extra)")]),

      para([bold("\nP4 — Roles Granulares")]),
      bullet([normal("Jerarquía definida: super_admin > admin > director_comercial > gerente > asesor")]),
      bullet([normal("Actualmente TODOS los usuarios pueden hacer TODO (sin restricciones)")]),
      bullet([normal("Necesita: tabla permisos_rol + helper verificarPermiso() + aplicar en cada server action")]),

      para([bold("\nP8 — Pricing A&B Reemplaza Renta")]),
      bullet([normal("Regla de negocio clave: Si A&B >= renta del salón, A&B REEMPLAZA la renta (no se suman)")]),
      bullet([normal("Actualmente el cálculo no implementa esta lógica")]),
      bullet([normal("Campos faltantes en cotizaciones: renta_salon, costo_ab, ab_reemplaza_renta, servicios_adicionales")]),

      // ===== SECTION 3: PRIORIDAD MEDIA =====
      heading("3. FEATURES NO IMPLEMENTADAS — PRIORIDAD MEDIA", HeadingLevel.HEADING_1),

      makeTable(
        ["#", "Feature", "Estado en Código"],
        [
          ["M1", "Huella digital cliente (dedup por teléfono/email)", "No existe. Sin índices únicos en tabla clientes por email/teléfono"],
          ["M2", "Notificaciones internas (Supabase Realtime)", "Existe lib/notifications/send-notifications.ts pero no tabla notificaciones ni Realtime"],
          ["M3", "Reportes gerenciales funcionales", "Ruta /reportes existe pero necesita queries reales según spec"],
          ["M4", "Montaje/desmontaje en calendario (ventana 10hrs)", "No implementado. Calendario muestra 8hrs pero salón está ocupado 10"],
          ["M5", "Testing automatizado (Vitest + Playwright)", "CERO tests. No hay vitest.config ni archivos .test.ts/.spec.ts"],
          ["M6", "Optimización tablet/iPad", "No verificable sin device. SPARK se usa en iPad en visitas presenciales"],
        ],
        [5, 35, 50]
      ),

      // ===== SECTION 4: PRIORIDAD BAJA =====
      heading("4. FEATURES NO IMPLEMENTADAS — PRIORIDAD BAJA", HeadingLevel.HEADING_1),

      makeTable(
        ["#", "Feature", "Estado en Código"],
        [
          ["B1", "Outlook Integration (email vía Azure)", "ON STANDBY — requiere registro en Azure Portal"],
          ["B2", "CI/CD pipeline (.github/workflows)", "No existe. Sin GitHub Actions configurado"],
          ["B3", "Rate limiting en login", "No implementado. Login sin protección contra brute force"],
          ["B4", "Seed data menu_items", "Parcial"],
        ],
        [5, 40, 45]
      ),

      // ===== SECTION 5: MIGRATIONS PENDIENTES =====
      heading("5. MIGRATIONS DE BASE DE DATOS PENDIENTES", HeadingLevel.HEADING_1),
      para([italic("La spec define que debe crearse scripts/MIGRATION-V2.sql con 7 tablas nuevas + columnas en 3 tablas existentes. NADA de esto existe en el código actual.")]),

      para([bold("Tablas nuevas por crear:")]),
      bullet([bold("salones_composicion"), normal(" — Relación padre-hijo entre salones divisibles")]),
      bullet([bold("empalmes"), normal(" — Registro de conflictos entre cotizaciones (mismo salón/fecha)")]),
      bullet([bold("autorizaciones_descuento"), normal(" — Flujo de aprobación de descuentos por rol")]),
      bullet([bold("pipedrive_id_map"), normal(" — Mapeo de IDs entre SPARK y Pipedrive")]),
      bullet([bold("pipedrive_sync_log"), normal(" — Log de sincronizaciones con Pipedrive")]),
      bullet([bold("clientes_merge_log"), normal(" — Deduplicación de clientes (merge de duplicados)")]),
      bullet([bold("notificaciones"), normal(" — Sistema de notificaciones internas por usuario")]),
      bullet([bold("permisos_rol"), normal(" — Permisos configurables por rol (5 niveles)")]),

      para([bold("\nColumnas nuevas en tablas existentes:")]),
      bullet([bold("cotizaciones: "), normal("renta_salon, costo_ab, ab_reemplaza_renta, servicios_adicionales, porcentaje_descuento, descuento_autorizado, autorizado_por, tipo_pipeline, num_personas, horas_evento, horas_extra, costo_hora_extra, hora_inicio, hora_fin, hora_montaje, hora_desmontaje")]),
      bullet([bold("salones: "), normal("salon_padre_id (FK a sí misma)")]),
      bullet([bold("usuarios: "), normal("rol_v2 (super_admin, admin, director_comercial, gerente, asesor)")]),

      // ===== SECTION 6: DIFERENCIAS ESTRUCTURALES =====
      heading("6. DIFERENCIAS ESTRUCTURALES", HeadingLevel.HEADING_1),

      makeTable(
        ["Aspecto", "Spec Dice", "Código Real"],
        [
          ["Scripts SQL", "MIGRATION-FINAL.sql es el único válido + obsoletos listados", "No existe MIGRATION-FINAL.sql. Hay 17 scripts numerados (001-009) con duplicados"],
          ["Pipedrive", "lib/pipedrive/client.ts, field-mapping.ts, types.ts (directorio dedicado)", "Solo lib/integrations/pipedrive.ts (1 archivo genérico en carpeta compartida)"],
          ["WhatsApp", "No mencionado en spec", "Existe lib/integrations/whatsapp.ts (feature extra no documentada)"],
          ["Proxy", "No mencionado en spec", "Existe proxy.ts + lib/middleware/proxy.ts (extra no documentado)"],
          ["Notificaciones", "Tabla notificaciones + Supabase Realtime", "Solo lib/notifications/send-notifications.ts (sin tabla en BD)"],
        ],
        [15, 35, 40]
      ),

      // ===== SECTION 7: RESUMEN EJECUTIVO =====
      heading("7. RESUMEN EJECUTIVO", HeadingLevel.HEADING_1),

      para([bold("Lo que funciona: "), normal("Los 17 módulos base están implementados y desplegados en producción. 21/21 server actions coinciden con la spec. Las rutas, componentes y estructura general del proyecto son correctas.")]),

      para([bold("Lo que falta (crítico): "), normal("8 features de alta prioridad que afectan la operación real del negocio — pricing incorrecto sin lógica A&B/renta, sin control de acceso por roles, sin detección de empalmes entre asesores, sin bloqueo cruzado de salones compuestos.")]),

      para([bold("Deuda técnica: "), normal("0 tests automatizados, 0 validación Zod en server actions, 0 CI/CD pipeline, 0 rate limiting en login.")]),

      para([bold("Base de datos: "), normal("7+ tablas nuevas y 16+ columnas por crear. Requiere archivo MIGRATION-V2.sql.")]),

      para([bold("Integración Pipedrive: "), normal("Apenas iniciada (1 archivo genérico vs 6 archivos requeridos + 2 tablas BD + webhook).")]),

      para([bold("\nOrden de ejecución sugerido por la spec: "), normal("P2 (Salones compuestos) → P8 (Pricing) → P3 (Horas extra) → P5 (Empalmes) → P6 (Descuentos) → P4 (Roles) → P1 (Pipedrive) → P7 (Zod)")]),
    ],
  }],
});

// Generate and save
const buffer = await Packer.toBuffer(doc);
writeFileSync("C:/claude/projects/spark/.docs/ANALISIS-COMPARATIVO-SPARK.docx", buffer);
console.log("✅ Archivo generado: C:/claude/projects/spark/.docs/ANALISIS-COMPARATIVO-SPARK.docx");
