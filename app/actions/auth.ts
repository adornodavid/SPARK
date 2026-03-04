"use server"

import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { crearSesion } from "./session"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function loginUser(
  email: string,
  password: string,
): Promise<{
  success: boolean
  error?: string
  message?: string
  role?: string
}> {
  try {
    // Paso 1: Buscar usuario por email o usuario en la tabla usuarios
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .or(`email.eq.${email},usuario.eq.${email}`)
      .single()

    // Si no se encuentra el usuario
    if (userError || !userData) {
      return {
        success: false,
        error: "credentials",
        message: "El correo electrónico/usuario o la contraseña son incorrectos.",
      }
    }

    // Paso 2: Comparar la contraseña con el password_hash de la tabla users
    const isPasswordValid = await bcrypt.compare(password, userData.password || "")

    if (!isPasswordValid) {
      return {
        success: false,
        error: "credentials",
        message: "El correo electrónico o la contraseña son incorrectos.",
      }
    }

    // Paso 3: Verificar si el usuario está activo
    if (!userData.activo) {
      return {
        success: false,
        error: "inactive",
        message: "Tu cuenta de usuario se encuentra inactiva.",
      }
    }

    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("nombre")
      .eq("id", userData.rolid)
      .single()

    if (roleError || !roleData) {
      console.error("Error obteniendo rol:", roleError)
      return {
        success: false,
        error: "server",
        message: "Error al obtener información del rol.",
      }
    }

    const { data: hotelesData, error: hotelesError } = await supabase
      .from("usuariosxhotel")
      .select("hotelid")
      .eq("usuarioid", userData.id)

    // Concatenar hotelids con | como separador
    const hotelesString = hotelesData && hotelesData.length > 0 ? hotelesData.map((h) => h.hotelid).join("/") : ""

    // Paso 4: Actualizar last_login
    await supabase.from("usuarios").update({ ultimoingreso: new Date().toISOString() }).eq("id", userData.id)

    // Paso 5: Crear las cookies de sesión con los datos del usuario
    await crearSesion({
      id: userData.id,
      email: userData.email,
      usuario: userData.usuario,
      nombrecompleto: userData.nombrecompleto,
      rolid: userData.rolid, // Agregado rolid
      rol: roleData.nombre,
      hoteles: hotelesString, // Agregado hoteles concatenados
    })

    return {
      success: true,
      role: roleData.nombre, // Retornar el nombre del rol
    }
  } catch (error) {
    console.error("Error en loginUser:", error)
    return {
      success: false,
      error: "server",
      message: "Error interno del servidor. Intenta de nuevo.",
    }
  }
}
