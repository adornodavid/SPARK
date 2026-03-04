import { NextResponse, type NextRequest } from "next/server"
import { Desencrypt } from "@/app/actions/utilerias"

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Obtener la cookie de sesión personalizada
  const sessionCookie = request.cookies.get("PortalMileniumComercialBanquetes")?.value

  let isAuthenticated = false
  let userRole = ""

  if (sessionCookie) {
    try {
      // Desencriptar la cookie
      const decryptedSession = await Desencrypt(sessionCookie)

      if (decryptedSession) {
        // Parsear el string de sesión (formato: clave:valor|clave:valor)
        const sessionParts = decryptedSession.split("|")
        let sesionActiva = false

        for (const part of sessionParts) {
          const [key, value] = part.split(":")
          if (key === "SesionActiva" && value === "true") {
            sesionActiva = true
          }
          if (key === "Rol") {
            userRole = value
          }
        }

        isAuthenticated = sesionActiva
      }
    } catch (error) {
      isAuthenticated = false
    }
  }

  // Proteger rutas admin
  if (request.nextUrl.pathname.startsWith("/admin") && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Proteger rutas dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard") && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return response
}
