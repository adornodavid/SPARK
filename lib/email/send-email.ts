/* ==================================================
  Email Sending Utility — SPARK Portal Comercial
  Uses Nodemailer with Gmail SMTP (configurable)

  Funciones:
    - sendEmail: Envio basico de email HTML
    - sendEmailWithAttachment: Email con archivos adjuntos
    - enviarCotizacionPorEmail: Envia cotizacion con PDF adjunto
    - generarHTMLCotizacion: Genera HTML del email de cotizacion
================================================== */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  Interfaces
================================================== */
export interface EmailOptions {
  to: string
  cc?: string
  subject: string
  html: string
  from?: string
}

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
  encoding?: string
}

export interface EmailWithAttachmentOptions extends EmailOptions {
  attachments: EmailAttachment[]
}

/* ==================================================
  Helper: Crear transporter de Nodemailer
================================================== */
async function createTransporter() {
  const nodemailer = await import("nodemailer")

  // Gmail SMTP configuration
  // Set these env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
  // For Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USER=tu@gmail.com, SMTP_PASS=app-password
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  })

  return transporter
}

/* ==================================================
  sendEmail: Envio basico de email HTML
================================================== */
export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Si no hay credenciales SMTP configuradas, simular envio
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("[SPARK Email] SMTP no configurado. Simulando envio a:", options.to)
      console.log("[SPARK Email] Asunto:", options.subject)
      return { success: true }
    }

    const transporter = await createTransporter()

    const mailOptions: any = {
      from: options.from || `"SPARK - MGHM" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }

    if (options.cc) {
      mailOptions.cc = options.cc
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("[SPARK Email] Error:", errorMessage)
    return { success: false, error: "Error enviando email: " + errorMessage }
  }
}

/* ==================================================
  sendEmailWithAttachment: Email con archivos adjuntos
================================================== */
export async function sendEmailWithAttachment(
  options: EmailWithAttachmentOptions,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Si no hay credenciales SMTP configuradas, simular envio
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("[SPARK Email] SMTP no configurado. Simulando envio con adjunto a:", options.to)
      console.log("[SPARK Email] Asunto:", options.subject)
      console.log("[SPARK Email] Adjuntos:", options.attachments.map((a) => a.filename).join(", "))
      return { success: true }
    }

    const transporter = await createTransporter()

    const mailOptions: any = {
      from: options.from || `"SPARK - MGHM" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || "application/pdf",
        encoding: att.encoding,
      })),
    }

    if (options.cc) {
      mailOptions.cc = options.cc
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("[SPARK Email] Error:", errorMessage)
    return { success: false, error: "Error enviando email: " + errorMessage }
  }
}

/* ==================================================
  Helpers de formato
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
  generarHTMLCotizacion: Genera el HTML del email
================================================== */
function generarHTMLCotizacion(cotizacion: any, hotel: any, mensajePersonalizado?: string): string {
  const c = cotizacion
  const h = hotel

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 30px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background-color: #65a30d; padding: 24px 32px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 2px;">SPARK</h1>
                    <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 12px;">Portal Comercial & Banquetes</p>
                  </td>
                  <td align="right">
                    <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${h.nombre || c.hotel || ""}</p>
                    ${h.telefono ? `<p style="margin: 2px 0 0; color: rgba(255,255,255,0.85); font-size: 11px;">${h.telefono}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 32px 16px;">
              <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px;">
                Estimado/a ${c.cliente || "Cliente"},
              </h2>
              ${mensajePersonalizado
                ? `<p style="margin: 0 0 16px; color: #4b5563; font-size: 14px; line-height: 1.6;">${mensajePersonalizado}</p>`
                : `<p style="margin: 0 0 16px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                    Es un placer enviarle la cotizacion para su evento. Adjuntamos el documento en formato PDF con todos los detalles.
                  </p>`
              }
            </td>
          </tr>

          <!-- Quote Summary Card -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td colspan="2" style="padding-bottom: 12px; border-bottom: 1px solid #bbf7d0;">
                          <p style="margin: 0; color: #65a30d; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Resumen de Cotizacion</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 4px; color: #6b7280; font-size: 12px;">Folio</td>
                        <td align="right" style="padding: 12px 0 4px; color: #111827; font-size: 14px; font-weight: 600;">${c.folio || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 12px;">Evento</td>
                        <td align="right" style="padding: 4px 0; color: #111827; font-size: 13px;">${c.nombreevento || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 12px;">Fecha</td>
                        <td align="right" style="padding: 4px 0; color: #111827; font-size: 13px;">${fmtDate(c.fechainicio)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 12px;">Salon</td>
                        <td align="right" style="padding: 4px 0; color: #111827; font-size: 13px;">${c.salon || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 12px;">Invitados</td>
                        <td align="right" style="padding: 4px 0; color: #111827; font-size: 13px;">${c.numeroinvitados || 0} personas</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 12px; border-top: 1px solid #bbf7d0;">
                          <table role="presentation" width="100%">
                            <tr>
                              <td style="color: #111827; font-size: 18px; font-weight: 700;">TOTAL</td>
                              <td align="right" style="color: #65a30d; font-size: 22px; font-weight: 700;">${fmtMoney(c.totalmonto)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PDF Notice -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" style="background-color: #fefce8; border-radius: 8px; border: 1px solid #fde68a;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 13px;">
                      <strong>Adjuntamos su cotizacion en PDF</strong> con el desglose completo de precios, condiciones y terminos del servicio.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Validity -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                Esta cotizacion es valida hasta el <strong style="color: #111827;">${fmtDate(c.validohasta)}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111827; padding: 24px 32px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; color: #d1d5db; font-size: 11px;">${h.nombre || c.hotel || ""}</p>
                    ${h.direccion ? `<p style="margin: 0 0 2px; color: #9ca3af; font-size: 10px;">${h.direccion}</p>` : ""}
                    ${h.telefono ? `<p style="margin: 0 0 2px; color: #9ca3af; font-size: 10px;">Tel: ${h.telefono}</p>` : ""}
                    ${h.email ? `<p style="margin: 0; color: #9ca3af; font-size: 10px;">${h.email}</p>` : ""}
                  </td>
                  <td align="right" valign="bottom">
                    <p style="margin: 0; color: #65a30d; font-size: 16px; font-weight: 700; letter-spacing: 2px;">SPARK</p>
                    <p style="margin: 2px 0 0; color: #6b7280; font-size: 9px;">Portal Comercial & Banquetes MGHM</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/* ==================================================
  enviarCotizacionPorEmail: Funcion principal para enviar
  cotizacion con PDF adjunto
================================================== */
export async function enviarCotizacionPorEmail(
  cotizacionId: number,
  destinatarioEmail: string,
  cc?: string,
  mensajePersonalizado?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Obtener datos de la cotizacion
    const { data: cotizacion, error: errCot } = await supabase
      .from("vw_oeventos")
      .select("*")
      .eq("id", cotizacionId)
      .maybeSingle()

    if (errCot || !cotizacion) {
      return { success: false, error: "No se encontro la cotizacion" }
    }

    // 2. Obtener datos del hotel
    const { data: hotel } = await supabase
      .from("hoteles")
      .select("nombre, direccion, telefono, email")
      .eq("id", cotizacion.hotelid)
      .maybeSingle()

    const hotelData = hotel || { nombre: cotizacion.hotel, direccion: "", telefono: "", email: "" }

    // 3. Generar PDF
    const { generarPDFCotizacion } = await import("@/app/actions/pdf")
    const pdfResult = await generarPDFCotizacion(cotizacionId)

    if (!pdfResult.success || !pdfResult.pdfBase64) {
      return { success: false, error: "Error generando PDF: " + pdfResult.error }
    }

    const pdfBuffer = Buffer.from(pdfResult.pdfBase64, "base64")

    // 4. Generar HTML del email
    const html = generarHTMLCotizacion(cotizacion, hotelData, mensajePersonalizado)

    // 5. Enviar email con PDF adjunto
    const subject = `Cotizacion ${cotizacion.folio} - ${cotizacion.nombreevento || "Evento"} | ${hotelData.nombre || cotizacion.hotel || "MGHM"}`

    const result = await sendEmailWithAttachment({
      to: destinatarioEmail,
      cc: cc || undefined,
      subject,
      html,
      attachments: [
        {
          filename: pdfResult.filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    // 6. Actualizar estatus a "Enviada" si esta en "Borrador"
    if (cotizacion.estatus === "Borrador") {
      await supabase
        .from("cotizaciones")
        .update({
          estatus: "Enviada",
          fechaactualizacion: new Date().toISOString(),
        })
        .eq("id", cotizacionId)
    }

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error enviando cotizacion: " + errorMessage }
  }
}
