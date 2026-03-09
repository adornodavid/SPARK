import { NextRequest, NextResponse } from "next/server"
import { enviarCotizacionPorEmail } from "@/lib/email/send-email"

const SESSION_COOKIE = "PortalMileniumComercialBanquetes"

export async function POST(request: NextRequest) {
  try {
    // Defense-in-depth: validate session (middleware also checks)
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
    if (!sessionCookie || sessionCookie.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "No autorizado — sesion requerida" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cotizacionId, destinatarioEmail, cc, mensaje } = body

    if (!cotizacionId || !destinatarioEmail) {
      return NextResponse.json(
        { success: false, error: "cotizacionId y destinatarioEmail son requeridos" },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(destinatarioEmail)) {
      return NextResponse.json(
        { success: false, error: "Formato de email invalido" },
        { status: 400 }
      )
    }

    const result = await enviarCotizacionPorEmail(
      Number(cotizacionId),
      destinatarioEmail,
      cc || undefined,
      mensaje || undefined,
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === "production"
          ? "Error interno del servidor"
          : "Error interno: " + errorMessage,
      },
      { status: 500 }
    )
  }
}
