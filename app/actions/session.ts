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
  id: string
  email: string
  usuario: string
  nombrecompleto: string
  rolid: string
  rol: string
  hoteles: string
}): Promise<void> {
  // Crear string de sesión con formato: clave:valor|clave:valor
  const sessionString = [
    `UsuarioId:${userData.id}`,
    `Email:${userData.email}`,
    `Usuario:${userData.usuario}`,
    `NombreCompleto:${userData.nombrecompleto}`,
    `RolId:${userData.rolid}`,
    `Rol:${userData.rol}`,
    `Hoteles:${userData.hoteles}`,
    `SesionActiva:true`,
  ].join("|")

  // Encriptar la sesión
  const sesionEncriptada = await Encrypt(sessionString)

  // Establecer la cookie
  await establecerSesionCookies(sesionEncriptada)
}

// Función: obtenerSesion / getSession: función para obtener las cookies de la sesion creada
export async function obtenerSesion(): Promise<oSession | null> {
  try {
    // Paso 1: Obtener la cookie desencriptada
    const cookieDesencriptada = await obtenerSesionCookies()

    if (!cookieDesencriptada) {
      return null
    }

    // Paso 2: dividir string por | y parsear cada par clave:valor
    const pares = cookieDesencriptada.split("|")

    const datos: Record<string, string> = {}
    for (const par of pares) {
      // Usar indexOf para solo dividir en el PRIMER ":" (protege valores con ":")
      const separador = par.indexOf(":")
      if (separador === -1) continue
      const clave = par.substring(0, separador)
      const valor = par.substring(separador + 1)
      datos[clave] = valor
    }

    if (!datos.UsuarioId || !datos.Email || datos.SesionActiva !== "true") {
      return null
    }

    return {
      UsuarioId: datos.UsuarioId,
      Email: datos.Email,
      Usuario: datos.Usuario || "",
      NombreCompleto: datos.NombreCompleto || "",
      RolId: datos.RolId || "",
      Rol: datos.Rol || "",
      Hoteles: datos.Hoteles || "",
      SesionActiva: datos.SesionActiva === "true",
    }
  } catch (error) {
    console.error("obtenerSesion error:", error)
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
    path: "/",
  }

  cookieStore.set("PortalMileniumComercialBanquetes", SesionEncriptada.toString(), cookieOptions)
}

// Función: obtenerSesionCookies / getSessionCookies: Función para obtener las cookies de la sesion
export async function obtenerSesionCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const cookieEncriptada = cookieStore.get("PortalMileniumComercialBanquetes")?.value

    if (!cookieEncriptada) {
      return null
    }

    const cookieDesencriptada = await Desencrypt(cookieEncriptada)
    return cookieDesencriptada
  } catch (error) {
    console.error("obtenerSesionCookies error:", error)
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
