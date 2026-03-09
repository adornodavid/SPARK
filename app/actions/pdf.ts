"use server"

/* ==================================================
  PDF Generation for Cotizaciones
  Fase 5 — SPARK Portal Comercial & Banquetes MGHM

  Funciones:
    - generarPDFCotizacion: Genera PDF profesional de una cotizacion
    - obtenerDatosCotizacionPDF: Obtiene todos los datos necesarios
================================================== */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  Helpers
================================================== */
function fmtMoney(n: number | string | null | undefined): string {
  const num = Number(n) || 0
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 })
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A"
  return new Date(d + "T12:00:00").toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/* ==================================================
  Obtener datos completos para el PDF
================================================== */
async function obtenerDatosCotizacionPDF(cotizacionId: number) {
  // Obtener cotizacion desde la vista
  const { data: cotizacion, error: errCot } = await supabase
    .from("vw_ocotizaciones")
    .select("*")
    .eq("id", cotizacionId)
    .maybeSingle()

  if (errCot || !cotizacion) {
    return { success: false, error: errCot?.message || "Cotizacion no encontrada", data: null }
  }

  // Obtener datos del hotel (direccion, telefono, email)
  const { data: hotel, error: errHotel } = await supabase
    .from("hoteles")
    .select("nombre, direccion, telefono, email, ciudad:ciudadid(nombre), estado:estadoid(nombre)")
    .eq("id", cotizacion.hotelid)
    .maybeSingle()

  return {
    success: true,
    error: "",
    data: {
      cotizacion,
      hotel: hotel || { nombre: cotizacion.hotel, direccion: "", telefono: "", email: "" },
    },
  }
}

/* ==================================================
  Generar PDF Cotizacion
  Returns: { success, error, pdfBase64, filename }
================================================== */
export async function generarPDFCotizacion(
  cotizacionId: number,
): Promise<{ success: boolean; error: string; pdfBase64: string | null; filename: string }> {
  try {
    const result = await obtenerDatosCotizacionPDF(cotizacionId)
    if (!result.success || !result.data) {
      return { success: false, error: result.error, pdfBase64: null, filename: "" }
    }

    const { cotizacion: c, hotel: h } = result.data

    // Dynamic import of jsPDF (server-side)
    const { jsPDF } = await import("jspdf")

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = margin

    // Colors
    const limeGreen = [101, 163, 13] as [number, number, number] // lime-600
    const darkGray = [55, 65, 81] as [number, number, number]
    const lightGray = [243, 244, 246] as [number, number, number]
    const black = [17, 25, 12] as [number, number, number]
    const white = [255, 255, 255] as [number, number, number]

    // =========================================
    // HEADER BAR
    // =========================================
    doc.setFillColor(...limeGreen)
    doc.rect(0, 0, pageWidth, 35, "F")

    // SPARK logo text
    doc.setTextColor(...white)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text("SPARK", margin, 18)

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Portal Comercial & Banquetes", margin, 26)

    // Hotel name on the right
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    const hotelName = h.nombre || c.hotel || "Hotel"
    doc.text(hotelName, pageWidth - margin, 16, { align: "right" })

    // Hotel contact info
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    const hotelAddress = h.direccion || ""
    const hotelPhone = h.telefono || ""
    const hotelEmail = h.email || ""
    if (hotelAddress) doc.text(hotelAddress, pageWidth - margin, 23, { align: "right" })
    if (hotelPhone || hotelEmail) {
      doc.text(`${hotelPhone}${hotelPhone && hotelEmail ? " | " : ""}${hotelEmail}`, pageWidth - margin, 29, { align: "right" })
    }

    y = 45

    // =========================================
    // COTIZACION TITLE
    // =========================================
    doc.setTextColor(...black)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("COTIZACION", margin, y)

    doc.setFontSize(20)
    doc.setTextColor(...limeGreen)
    doc.text(c.folio || "", pageWidth - margin, y, { align: "right" })

    y += 10

    // =========================================
    // QUOTE INFO BAR
    // =========================================
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "F")

    doc.setFontSize(8)
    doc.setTextColor(...darkGray)
    const infoY = y + 8
    const col1 = margin + 5
    const col2 = margin + contentWidth * 0.25
    const col3 = margin + contentWidth * 0.5
    const col4 = margin + contentWidth * 0.75

    doc.setFont("helvetica", "bold")
    doc.text("Fecha Emision:", col1, infoY)
    doc.text("Vigencia:", col2, infoY)
    doc.text("Estatus:", col3, infoY)
    doc.text("Vendedor:", col4, infoY)

    doc.setFont("helvetica", "normal")
    doc.setTextColor(...black)
    doc.text(fmtDate(c.fechacreacion), col1, infoY + 6)
    doc.text(fmtDate(c.validohasta), col2, infoY + 6)
    doc.text(c.estatus || "Borrador", col3, infoY + 6)
    doc.text(c.vendedor || "N/A", col4, infoY + 6)

    y += 28

    // =========================================
    // CLIENT INFO
    // =========================================
    doc.setFillColor(...limeGreen)
    doc.rect(margin, y, contentWidth, 8, "F")
    doc.setTextColor(...white)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("DATOS DEL CLIENTE", margin + 4, y + 5.5)
    y += 12

    doc.setTextColor(...black)
    doc.setFontSize(9)

    const clientCol1 = margin + 4
    const clientCol2 = margin + contentWidth * 0.5

    doc.setFont("helvetica", "bold")
    doc.text("Cliente:", clientCol1, y)
    doc.setFont("helvetica", "normal")
    doc.text(c.cliente || "N/A", clientCol1 + 25, y)

    if (c.clienteemail) {
      doc.setFont("helvetica", "bold")
      doc.text("Email:", clientCol2, y)
      doc.setFont("helvetica", "normal")
      doc.text(c.clienteemail, clientCol2 + 25, y)
    }

    y += 6

    if (c.clientetelefono) {
      doc.setFont("helvetica", "bold")
      doc.text("Telefono:", clientCol1, y)
      doc.setFont("helvetica", "normal")
      doc.text(c.clientetelefono, clientCol1 + 25, y)
    }

    if (c.clienteempresa) {
      doc.setFont("helvetica", "bold")
      doc.text("Empresa:", clientCol2, y)
      doc.setFont("helvetica", "normal")
      doc.text(c.clienteempresa, clientCol2 + 25, y)
    }

    y += 12

    // =========================================
    // EVENT DETAILS
    // =========================================
    doc.setFillColor(...limeGreen)
    doc.rect(margin, y, contentWidth, 8, "F")
    doc.setTextColor(...white)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("DETALLES DEL EVENTO", margin + 4, y + 5.5)
    y += 12

    doc.setTextColor(...black)
    doc.setFontSize(9)

    // Row 1: Event name & Type
    doc.setFont("helvetica", "bold")
    doc.text("Evento:", clientCol1, y)
    doc.setFont("helvetica", "normal")
    doc.text(c.nombreevento || "N/A", clientCol1 + 25, y)

    doc.setFont("helvetica", "bold")
    doc.text("Tipo:", clientCol2, y)
    doc.setFont("helvetica", "normal")
    doc.text(c.tipoevento || "N/A", clientCol2 + 25, y)
    y += 6

    // Row 2: Date & Time
    doc.setFont("helvetica", "bold")
    doc.text("Fecha:", clientCol1, y)
    doc.setFont("helvetica", "normal")
    doc.text(fmtDate(c.fechainicio), clientCol1 + 25, y)

    doc.setFont("helvetica", "bold")
    doc.text("Horario:", clientCol2, y)
    doc.setFont("helvetica", "normal")
    doc.text(`${c.horainicio || "?"} - ${c.horafin || "?"}`, clientCol2 + 25, y)
    y += 6

    // Row 3: Salon & Montaje
    doc.setFont("helvetica", "bold")
    doc.text("Salon:", clientCol1, y)
    doc.setFont("helvetica", "normal")
    doc.text(c.salon || "N/A", clientCol1 + 25, y)

    doc.setFont("helvetica", "bold")
    doc.text("Montaje:", clientCol2, y)
    doc.setFont("helvetica", "normal")
    doc.text(c.montaje || "N/A", clientCol2 + 25, y)
    y += 6

    // Row 4: Guests
    doc.setFont("helvetica", "bold")
    doc.text("Invitados:", clientCol1, y)
    doc.setFont("helvetica", "normal")
    doc.text(`${c.numeroinvitados || 0} personas`, clientCol1 + 25, y)
    y += 14

    // =========================================
    // PRICING TABLE
    // =========================================
    doc.setFillColor(...limeGreen)
    doc.rect(margin, y, contentWidth, 8, "F")
    doc.setTextColor(...white)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("DESGLOSE DE PRECIOS", margin + 4, y + 5.5)
    y += 12

    // Table header
    const tableX = margin
    const descCol = margin + 4
    const amountCol = pageWidth - margin - 4

    doc.setFillColor(240, 240, 240)
    doc.rect(tableX, y, contentWidth, 8, "F")
    doc.setTextColor(...darkGray)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("Concepto", descCol, y + 5.5)
    doc.text("Monto", amountCol, y + 5.5, { align: "right" })
    y += 10

    doc.setTextColor(...black)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    // Helper to draw a price row
    function drawPriceRow(label: string, amount: string, isBold = false, isDiscount = false) {
      if (isBold) doc.setFont("helvetica", "bold")
      else doc.setFont("helvetica", "normal")

      if (isDiscount) doc.setTextColor(220, 38, 38) // red
      else doc.setTextColor(...black)

      doc.text(label, descCol, y + 4)
      doc.text(amount, amountCol, y + 4, { align: "right" })

      // Bottom border
      doc.setDrawColor(230, 230, 230)
      doc.line(tableX, y + 7, tableX + contentWidth, y + 7)
      y += 9
    }

    // Precio Salon
    const precioSalon = Number(c.preciosalonsiva) || 0
    if (precioSalon > 0) {
      drawPriceRow("Renta de Salon", fmtMoney(precioSalon))
    }

    // Menu
    const precioMenu = Number(c.preciomenupp) || 0
    const pax = Number(c.numeroinvitados) || 0
    if (precioMenu > 0) {
      const totalMenu = precioMenu * pax
      drawPriceRow(`Menu por persona (${pax} pax x ${fmtMoney(precioMenu)})`, fmtMoney(totalMenu))
    }

    // Descuento
    const descuentoPct = Number(c.porcentajedescuento) || 0
    const montoDescuento = Number(c.montodescuento) || 0
    if (descuentoPct > 0) {
      drawPriceRow(`Descuento (${descuentoPct}%)`, `-${fmtMoney(montoDescuento)}`, false, true)
    }

    // Separator line before subtotal
    y += 2
    doc.setDrawColor(...limeGreen)
    doc.setLineWidth(0.5)
    doc.line(tableX + contentWidth * 0.5, y, tableX + contentWidth, y)
    y += 4

    doc.setTextColor(...darkGray)

    // Subtotal
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text("Subtotal", descCol + contentWidth * 0.5, y + 4)
    doc.text(fmtMoney(c.subtotal), amountCol, y + 4, { align: "right" })
    y += 8

    // IVA
    doc.text("IVA (16%)", descCol + contentWidth * 0.5, y + 4)
    doc.text(fmtMoney(c.impuestos), amountCol, y + 4, { align: "right" })
    y += 10

    // Total line
    doc.setDrawColor(...limeGreen)
    doc.setLineWidth(1)
    doc.line(tableX + contentWidth * 0.4, y, tableX + contentWidth, y)
    y += 2

    // TOTAL
    doc.setFillColor(...limeGreen)
    doc.roundedRect(tableX + contentWidth * 0.4, y, contentWidth * 0.6, 14, 2, 2, "F")
    doc.setTextColor(...white)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("TOTAL", descCol + contentWidth * 0.42, y + 10)
    doc.text(fmtMoney(c.totalmonto), amountCol - 2, y + 10, { align: "right" })
    y += 22

    // =========================================
    // NOTAS (if any)
    // =========================================
    if (c.notas) {
      doc.setTextColor(...black)
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text("Notas:", margin, y)
      doc.setFont("helvetica", "normal")
      const splitNotas = doc.splitTextToSize(c.notas, contentWidth - 10)
      doc.text(splitNotas, margin + 4, y + 6)
      y += 6 + splitNotas.length * 4 + 6
    }

    // =========================================
    // TERMS & CONDITIONS
    // =========================================
    // Check if we need a new page
    if (y > pageHeight - 80) {
      doc.addPage()
      y = margin
    }

    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, y, contentWidth, 50, 2, 2, "F")
    y += 6

    doc.setTextColor(...darkGray)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("TERMINOS Y CONDICIONES", margin + 4, y)
    y += 6

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    const terms = [
      `1. Esta cotizacion tiene vigencia hasta el ${fmtDate(c.validohasta)}. Posterior a esta fecha, los precios pueden variar.`,
      "2. Para confirmar el evento se requiere un anticipo del 50% del monto total.",
      "3. El pago restante debera liquidarse 5 dias habiles antes del evento.",
      "4. En caso de cancelacion con menos de 15 dias de anticipacion, se retendra el 30% del anticipo.",
      "5. Los precios incluyen el uso del salon, montaje basico y servicio de meseros.",
      "6. Servicios adicionales (audio, decoracion, valet parking) se cotizan por separado.",
      "7. El numero final de invitados debe confirmarse 7 dias antes del evento.",
    ]

    terms.forEach((term) => {
      const splitTerm = doc.splitTextToSize(term, contentWidth - 10)
      doc.text(splitTerm, margin + 4, y)
      y += splitTerm.length * 3.5 + 1.5
    })

    // =========================================
    // FOOTER
    // =========================================
    const footerY = pageHeight - 15
    doc.setDrawColor(...limeGreen)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

    doc.setFontSize(7)
    doc.setTextColor(...darkGray)
    doc.setFont("helvetica", "normal")
    doc.text(
      "Generado por SPARK — Portal Comercial & Banquetes MGHM",
      pageWidth / 2,
      footerY,
      { align: "center" }
    )
    doc.text(
      `Documento generado el ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      pageWidth / 2,
      footerY + 4,
      { align: "center" }
    )

    // Generate PDF as base64
    const pdfOutput = doc.output("arraybuffer")
    const pdfBuffer = Buffer.from(pdfOutput)
    const pdfBase64 = pdfBuffer.toString("base64")

    const filename = `Cotizacion_${c.folio || cotizacionId}_${new Date().toISOString().split("T")[0]}.pdf`

    return { success: true, error: "", pdfBase64, filename }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error generando PDF: " + errorMessage,
      pdfBase64: null,
      filename: "",
    }
  }
}

/* ==================================================
  Obtener PDF como Buffer (para adjuntar a email)
================================================== */
export async function obtenerPDFBuffer(
  cotizacionId: number,
): Promise<{ success: boolean; error: string; buffer: Buffer | null; filename: string }> {
  const result = await generarPDFCotizacion(cotizacionId)
  if (!result.success || !result.pdfBase64) {
    return { success: false, error: result.error, buffer: null, filename: "" }
  }

  const buffer = Buffer.from(result.pdfBase64, "base64")
  return { success: true, error: "", buffer, filename: result.filename }
}
