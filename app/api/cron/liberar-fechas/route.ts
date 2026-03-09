import { NextRequest, NextResponse } from "next/server"
import { liberarFechasVencidas } from "@/app/actions/pagos"

/**
 * API Route: /api/cron/liberar-fechas
 *
 * Busca cotizaciones con vigencia expirada (validohasta < hoy)
 * y cambia su estatus a "Vencida", liberando las fechas.
 *
 * Puede ser llamado por:
 * - Vercel Cron (configurar en vercel.json)
 * - Llamada manual (GET o POST)
 *
 * Vercel Cron config (en vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/liberar-fechas",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 *
 * SEGURIDAD:
 * - Middleware valida CRON_SECRET en /api/cron/* antes de llegar aqui
 * - Defensa en profundidad: se valida de nuevo aqui como fallback
 * - En produccion SIN CRON_SECRET configurado, el middleware bloquea (503)
 */

export async function GET(request: NextRequest) {
  try {
    // Defense-in-depth: validate auth even though middleware does it
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      )
    }

    // In production, require CRON_SECRET
    if (process.env.NODE_ENV === "production" && !cronSecret) {
      return NextResponse.json(
        { success: false, error: "CRON_SECRET no configurado" },
        { status: 503 },
      )
    }

    const result = await liberarFechasVencidas()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: result.liberadas > 0
        ? `${result.liberadas} cotizacion(es) vencida(s) liberada(s)`
        : "No hay cotizaciones vencidas por liberar",
      liberadas: result.liberadas,
      detalles: result.detalles,
      ejecutadoEn: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("[SPARK] Error en cron liberar-fechas:", errorMessage)
    return NextResponse.json(
      // Do not leak internal error details in production
      {
        success: false,
        error: process.env.NODE_ENV === "production"
          ? "Error interno del servidor"
          : "Error interno: " + errorMessage,
      },
      { status: 500 },
    )
  }
}

// POST endpoint (alternativa para uso manual desde admin)
export async function POST(request: NextRequest) {
  return GET(request)
}
