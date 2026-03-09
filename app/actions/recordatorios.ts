"use server"

/* ==================================================
  Recordatorios — Sistema de alertas de cotizaciones
  Fase 5 — SPARK Portal Comercial & Banquetes MGHM

  Funciones:
    - verificarCotizacionesPorVencer: Busca cotizaciones que vencen pronto
    - enviarRecordatorio: Envia email de recordatorio individual
    - obtenerCotizacionesPorVencer: Obtiene lista para mostrar en dashboard
================================================== */

import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/send-email"

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

function diasHastaVencimiento(validoHasta: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vencimiento = new Date(validoHasta + "T00:00:00")
  const diff = vencimiento.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/* ==================================================
  obtenerCotizacionesPorVencer
  Retorna cotizaciones con vigencia que vence en los proximos X dias
================================================== */
export async function obtenerCotizacionesPorVencer(
  diasAnticipacion = 3,
): Promise<{
  success: boolean
  error: string
  data: any[] | null
  resumen: { porVencer: number; vencidas: number }
}> {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const fechaLimite = new Date(hoy)
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion)

    // Obtener cotizaciones activas en estatus Enviada o Aceptada con vigencia proxima
    const { data: cotizaciones, error } = await supabase
      .from("vw_ocotizaciones")
      .select("*")
      .eq("activo", true)
      .in("estatus", ["Enviada", "Borrador"])
      .not("validohasta", "is", null)
      .lte("validohasta", fechaLimite.toISOString().split("T")[0])
      .order("validohasta", { ascending: true })

    if (error) {
      return {
        success: false,
        error: "Error obteniendo cotizaciones: " + error.message,
        data: null,
        resumen: { porVencer: 0, vencidas: 0 },
      }
    }

    const hoyStr = hoy.toISOString().split("T")[0]
    let porVencer = 0
    let vencidas = 0

    const cotizacionesConDias = (cotizaciones || []).map((c) => {
      const dias = diasHastaVencimiento(c.validohasta)
      if (dias < 0) {
        vencidas++
      } else {
        porVencer++
      }
      return {
        ...c,
        diasRestantes: dias,
        estadoVigencia: dias < 0 ? "Vencida" : dias === 0 ? "Vence hoy" : `Vence en ${dias} dia${dias === 1 ? "" : "s"}`,
      }
    })

    return {
      success: true,
      error: "",
      data: cotizacionesConDias,
      resumen: { porVencer, vencidas },
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error: " + errorMessage,
      data: null,
      resumen: { porVencer: 0, vencidas: 0 },
    }
  }
}

/* ==================================================
  verificarCotizacionesPorVencer
  Verifica y retorna resumen de cotizaciones por vencer (2-3 dias)
================================================== */
export async function verificarCotizacionesPorVencer(): Promise<{
  success: boolean
  error: string
  porVencer: number
  vencidas: number
  cotizaciones: any[]
}> {
  const result = await obtenerCotizacionesPorVencer(3)

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      porVencer: 0,
      vencidas: 0,
      cotizaciones: [],
    }
  }

  return {
    success: true,
    error: "",
    porVencer: result.resumen.porVencer,
    vencidas: result.resumen.vencidas,
    cotizaciones: result.data || [],
  }
}

/* ==================================================
  enviarRecordatorio
  Envia email recordatorio a cliente sobre cotizacion por vencer
================================================== */
export async function enviarRecordatorio(
  cotizacionId: number,
): Promise<{ success: boolean; error: string }> {
  try {
    // Obtener datos de la cotizacion
    const { data: cotizacion, error: errCot } = await supabase
      .from("vw_ocotizaciones")
      .select("*")
      .eq("id", cotizacionId)
      .maybeSingle()

    if (errCot || !cotizacion) {
      return { success: false, error: "Cotizacion no encontrada" }
    }

    if (!cotizacion.clienteemail) {
      return { success: false, error: "El cliente no tiene email registrado" }
    }

    // Obtener datos del hotel
    const { data: hotel } = await supabase
      .from("hoteles")
      .select("nombre, direccion, telefono, email")
      .eq("id", cotizacion.hotelid)
      .maybeSingle()

    const h = hotel || { nombre: cotizacion.hotel, direccion: "", telefono: "", email: "" }
    const diasRestantes = diasHastaVencimiento(cotizacion.validohasta)

    const urgencia = diasRestantes <= 0
      ? "Su cotizacion ha expirado"
      : diasRestantes === 1
        ? "Su cotizacion vence manana"
        : `Su cotizacion vence en ${diasRestantes} dias`

    const html = `
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
                    <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${h.nombre || ""}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px;">
                Estimado/a ${cotizacion.cliente || "Cliente"},
              </h2>

              <!-- Urgency Banner -->
              <table role="presentation" width="100%" style="margin: 16px 0; background-color: ${diasRestantes <= 0 ? "#fef2f2" : "#fffbeb"}; border-radius: 8px; border: 1px solid ${diasRestantes <= 0 ? "#fecaca" : "#fde68a"};">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: ${diasRestantes <= 0 ? "#991b1b" : "#92400e"}; font-size: 15px; font-weight: 600;">
                      ${urgencia}
                    </p>
                    <p style="margin: 6px 0 0; color: ${diasRestantes <= 0 ? "#b91c1c" : "#a16207"}; font-size: 13px;">
                      Vigencia: ${fmtDate(cotizacion.validohasta)}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                Le recordamos que tiene una cotizacion pendiente para su evento
                <strong>${cotizacion.nombreevento || ""}</strong> programado para el
                <strong>${fmtDate(cotizacion.fechainicio)}</strong>.
              </p>

              <!-- Quick Summary -->
              <table role="presentation" width="100%" style="margin: 16px 0; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td style="color: #6b7280; font-size: 12px;">Folio</td>
                        <td align="right" style="color: #111827; font-size: 14px; font-weight: 600;">${cotizacion.folio}</td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px; color: #6b7280; font-size: 12px;">Salon</td>
                        <td align="right" style="padding-top: 8px; color: #111827; font-size: 13px;">${cotizacion.salon || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px; color: #6b7280; font-size: 12px;">Total</td>
                        <td align="right" style="padding-top: 8px; color: #65a30d; font-size: 18px; font-weight: 700;">${fmtMoney(cotizacion.totalmonto)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                Para confirmar su evento o solicitar una extension de la cotizacion, no dude en contactarnos.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111827; padding: 24px 32px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; color: #d1d5db; font-size: 11px;">${h.nombre || ""}</p>
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

    const subject = `Recordatorio: Cotizacion ${cotizacion.folio} - ${urgencia} | ${h.nombre || cotizacion.hotel || "MGHM"}`

    const result = await sendEmail({
      to: cotizacion.clienteemail,
      subject,
      html,
    })

    if (!result.success) {
      return { success: false, error: result.error || "Error enviando recordatorio" }
    }

    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error: " + errorMessage }
  }
}
