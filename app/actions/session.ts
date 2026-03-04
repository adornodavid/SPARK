"use server"

/* ==================================================
  Imports
================================================== */
import { cookies } from "next/headers"
import type { oSession } from "@/types/usuarios"
import { Desencrypt, Encrypt } from "./utilerias"

/* ==================================================
  Funciones
  --------------------
  * Session
    - crearSesion / setSession
    - obtenerSesion / getSession

  * Cookies
    - establecerSesionCookies / setSessionCookies
    - obtenerSesionCookies / getSessionCookies
    - eliminarSesionCookies / deleteSessionCookies
    - obtenerCoookie / getCookie
================================================== */

// Función: crearSesion / setSession: Funcion donde se crea la sesion
export async function crearSesion(userData: {
  Id: string
  email: string
  usuario: string
  nombrecompleto: string
  rolid: string
  rol: string
  hoteles: string
}): Promise<void> {
  console.log("[v0] crearSesion - Iniciando con userData:", JSON.stringify(userData))

  // Crear string de sesión con formato: clave:valor|clave:valor
  const sessionString = [
    `UsuarioId:${userData.Id}`,
    `Email:${userData.email}`,
    `Usuario:${userData.usuario}`,
    `NombreCompleto:${userData.nombrecompleto}`,
    `RolId:${userData.rolid}`,
    `Rol:${userData.rol}`,
    `Hoteles:${userData.hoteles}`,
    `SesionActiva:true`,
  ].join("|")

  console.log("[v0] crearSesion - sessionString creado:", sessionString)

  // Encriptar la sesión
  const sesionEncriptada = await Encrypt(sessionString)
  console.log("[v0] crearSesion - sesionEncriptada:", sesionEncriptada ? "OK (tiene valor)" : "VACIO")

  // Establecer la cookie
  await establecerSesionCookies(sesionEncriptada)
  console.log("[v0] crearSesion - Cookie establecida")
}

// Función: obtenerSesion / getSession: función para obtener las cookies de la sesion creada
export async function obtenerSesion(): Promise<oSession | null> {
  try {
    console.log("[v0] obtenerSesion - Iniciando...")

    // Paso 1: Obtener la cookie desencriptada
    const CookiesDesencryptadas = await obtenerSesionCookies()
    console.log("[v0] obtenerSesion - CookiesDesencryptadas:", CookiesDesencryptadas)

    if (!CookiesDesencryptadas) {
      console.log("[v0] obtenerSesion - No hay cookies, retornando null")
      return null
    }

    // Paso 2: dividir string de cookie desencriptada, dividir por | y guardar en un array
    const CookiesArray = CookiesDesencryptadas?.split("|") || []
    console.log("[v0] obtenerSesion - CookiesArray:", CookiesArray)

    // Paso 3: recorrer array y volver a dividir cada 1 por : y crear su variable
    let UsuarioId = ""
    let Email = ""
    let Usuario = ""
    let NombreCompleto = ""
    let RolId = ""
    let Rol = ""
    let Hoteles = ""
    let SesionActiva = ""

    for (const elemento of CookiesArray) {
      const [clave, valor] = elemento.split(":")

      switch (clave) {
        case "UsuarioId":
          UsuarioId = valor
          break
        case "Email":
          Email = valor
          break
        case "Usuario":
          Usuario = valor
          break
        case "NombreCompleto":
          NombreCompleto = valor
          break
        case "RolId":
          RolId = valor
          break
        case "Rol":
          Rol = valor
          break
        case "Hoteles":
          Hoteles = valor
          break
        case "SesionActiva":
          SesionActiva = valor
          break
      }
    }

    console.log("[v0] obtenerSesion - Variables parseadas:", {
      UsuarioId,
      Email,
      Usuario,
      NombreCompleto,
      RolId,
      Rol,
      Hoteles,
      SesionActiva,
    })

    if (!UsuarioId || !Email || SesionActiva !== "true") {
      console.log("[v0] obtenerSesion - Validación fallida, retornando null")
      return null
    }

    const sessionResult = {
      UsuarioId: UsuarioId,
      Email: Email,
      Usuario: Usuario,
      NombreCompleto: NombreCompleto || "",
      RolId: RolId || "",
      Rol: Rol || "",
      Hoteles: Hoteles || "",
      SesionActiva: SesionActiva === "true",
    }

    console.log("[v0] obtenerSesion - Retornando sesión:", JSON.stringify(sessionResult))
    return sessionResult
  } catch (error) {
    console.error("[v0] obtenerSesion - ERROR:", error)
    return null
  }
}

// Funcion: establecerSesionCookies / setSessionCookies: Función donde se crea la cookie/ticket
export async function establecerSesionCookies(SesionEncriptada: string): Promise<void> {
  const cookieStore = await cookies()

  // Configurar cookies con duración de 1 día
  const cookieOptions = {
    maxAge: 1 * 24 * 60 * 60, // 1 día en segundos
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  }

  cookieStore.set("PortalMileniumComercialBanquetes", SesionEncriptada.toString(), cookieOptions)
}

// Función: obtenerSesionCookies / getSessionCookies: Función para obtener las cookies de la sesion
export async function obtenerSesionCookies(): Promise<string | null> {
  try {
    console.log("[v0] obtenerSesionCookies - Iniciando...")
    const cookieStore = await cookies()

    const CookieEncriptada = cookieStore.get("PortalMileniumComercialBanquetes")?.value
    console.log("[v0] obtenerSesionCookies - CookieEncriptada existe:", !!CookieEncriptada)

    if (!CookieEncriptada) {
      console.log("[v0] obtenerSesionCookies - No se encontró la cookie")
      return null
    }

    // Desencriptar la cookie
    console.log("[v0] obtenerSesionCookies - Desencriptando...")
    const CookieDesencriptada = await Desencrypt(CookieEncriptada)
    console.log("[v0] obtenerSesionCookies - CookieDesencriptada:", CookieDesencriptada)

    return CookieDesencriptada
  } catch (error) {
    console.error("[v0] obtenerSesionCookies - ERROR:", error)
    return null
  }
}

// Función: eliminarSesionCookies / deleteSessionCookies: función para limpiar las cookies de la sesion creada
export async function eliminarSesionCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("PortalMileniumComercialBanquetes")
}

// Función: obtenerCoookie / getCookie, función para obtener la cookie y la informacion
export async function obtenerCookie() {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get("PortalMileniumComercialBanquetes")

    if (!cookie) {
      return {
        success: false,
        message: "Cookie no encontrada",
        data: null,
      }
    }

    const cookieInfo = {
      nombre: cookie.name,
      valor: cookie.value,
      existe: true,
      configuracion: {
        maxAge: 1 * 24 * 60 * 60,
        maxAgeDias: 1,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
      tiempoMaximoVida: "1 día (86400 segundos)",
    }

    return {
      success: true,
      message: "Cookie obtenida exitosamente",
      data: cookieInfo,
    }
  } catch (error) {
    console.error("Error obteniendo información de la cookie:", error)
    return {
      success: false,
      message: "Error al obtener la cookie",
      data: null,
    }
  }
}

// Nueva función para obtener variables de sesión (alias de obtenerSesion)
export const obtenerVariablesSesion = obtenerSesion
