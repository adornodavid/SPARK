"use server"

import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { crearSesion } from "./session"
import { Encrypt, Desencrypt, HashData } from "./utilerias"
import { sendEmail } from "@/lib/email/send-email"

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
      rolid: userData.rolid,
      rol: roleData.nombre,
      hoteles: hotelesString,
    })

    return {
      success: true,
      role: roleData.nombre,
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

/* ==================================================
  Recuperación de contraseña
================================================== */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const TOKEN_VALIDEZ_DIAS = 5

/* --------------------------------------------------
  solicitarRecuperacionPassword
  - Valida que el email exista en la tabla usuarios
  - Genera token (Encrypt de "id|timestamp|random") y lo guarda
  - Envía email con link a /auth/cambiar-contrasena?token=...&id=...
-------------------------------------------------- */
export async function solicitarRecuperacionPassword(
  email: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const emailLimpio = email.trim().toLowerCase()
    if (!emailLimpio || !emailLimpio.includes("@")) {
      return { success: false, error: "invalid", message: "Por favor ingresa un correo válido." }
    }

    // 1) Validar que el email exista en usuarios
    const { data: usuario, error: errUsr } = await supabase
      .from("usuarios")
      .select("id, email, nombrecompleto, activo")
      .ilike("email", emailLimpio)
      .maybeSingle()

    if (errUsr || !usuario) {
      return {
        success: false,
        error: "notfound",
        message: "El correo ingresado no se encuentra registrado en el sistema.",
      }
    }

    if (!usuario.activo) {
      return {
        success: false,
        error: "inactive",
        message: "Tu cuenta de usuario se encuentra inactiva. Comunícate con el administrador.",
      }
    }

    // 2) Generar token = Encrypt(id|timestamp|random)
    const random = crypto.randomBytes(8).toString("hex")
    const payload = `${usuario.id}|${Date.now()}|${random}`
    const tokenEncriptado = await Encrypt(payload)

    // 3) Calcular fecha de vencimiento (+5 días)
    const fechaVencimiento = new Date()
    fechaVencimiento.setDate(fechaVencimiento.getDate() + TOKEN_VALIDEZ_DIAS)
    const fechaVencISO = fechaVencimiento.toISOString().slice(0, 10)

    // 4) Insertar en tabla tokens
    const { error: errTok } = await supabase
      .from("tokens")
      .insert({
        token: tokenEncriptado,
        fechavencimiento: fechaVencISO,
        activo: true,
      })

    if (errTok) {
      console.error("Error guardando token:", errTok)
      return { success: false, error: "server", message: "No se pudo generar el token. Intenta de nuevo." }
    }

    // 5) Construir URL y enviar email
    const tokenUrl = encodeURIComponent(tokenEncriptado)
    const link = `${APP_URL}/auth/cambiar-contrasena?token=${tokenUrl}&id=${usuario.id}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
        <h2 style="color: #111827;">Recuperación de contraseña — SPARK</h2>
        <p>Hola <strong>${usuario.nombrecompleto || "usuario"}</strong>,</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p>Para crear una nueva contraseña haz clic en el siguiente botón:</p>
        <p style="margin: 32px 0;">
          <a href="${link}"
             style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            Cambiar mi contraseña
          </a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
          <a href="${link}" style="color: #2563eb; word-break: break-all;">${link}</a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">
          Este enlace estará disponible por <strong>${TOKEN_VALIDEZ_DIAS} días</strong> y solo puede usarse una vez.
        </p>
        <p style="font-size: 14px; color: #6b7280;">
          Si no solicitaste este cambio, puedes ignorar este correo.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 12px; color: #9ca3af;">SPARK — Portal Comercial MGHM</p>
      </div>
    `

    const emailResult = await sendEmail({
      to: usuario.email,
      subject: "Recuperación de contraseña — SPARK",
      html,
    })

    if (!emailResult.success) {
      return {
        success: false,
        error: "email",
        message: "El token se generó pero hubo un problema al enviar el correo. Comunícate con el administrador.",
      }
    }

    return {
      success: true,
      message: "Te hemos enviado un correo con instrucciones para restablecer tu contraseña.",
    }
  } catch (error) {
    console.error("Error en solicitarRecuperacionPassword:", error)
    return { success: false, error: "server", message: "Error interno. Intenta de nuevo." }
  }
}

/* --------------------------------------------------
  validarTokenPassword
  - Verifica token activo, no vencido, y que el id en la URL
    coincida con el id encriptado dentro del token.
  - Devuelve datos básicos del usuario para mostrar en el form.
-------------------------------------------------- */
export async function validarTokenPassword(
  token: string,
  usuarioId: number,
): Promise<{
  success: boolean
  error?: string
  message?: string
  usuario?: { id: number; nombrecompleto: string; email: string }
}> {
  try {
    if (!token || !usuarioId || usuarioId <= 0) {
      return { success: false, error: "invalid", message: "Enlace inválido o incompleto." }
    }

    // 1) Buscar token en la tabla
    const { data: tokenRow, error: errTok } = await supabase
      .from("tokens")
      .select("id, token, fechavencimiento, activo")
      .eq("token", token)
      .maybeSingle()

    if (errTok || !tokenRow) {
      return { success: false, error: "notfound", message: "El enlace de recuperación no es válido." }
    }

    // 2) Validar AND: activo=true Y no vencido
    if (!tokenRow.activo) {
      return { success: false, error: "used", message: "Este enlace ya fue utilizado. Solicita uno nuevo." }
    }

    const hoy = new Date().toISOString().slice(0, 10)
    if (tokenRow.fechavencimiento < hoy) {
      return { success: false, error: "expired", message: "El enlace de recuperación ha expirado. Solicita uno nuevo." }
    }

    // 3) Desencriptar token y comparar id con el de la URL
    let payload: string
    try {
      payload = await Desencrypt(token)
    } catch {
      return { success: false, error: "invalid", message: "El enlace de recuperación no es válido." }
    }

    const idDelToken = parseInt(payload.split("|")[0], 10)
    if (!idDelToken || idDelToken !== usuarioId) {
      return { success: false, error: "mismatch", message: "El enlace de recuperación no es válido." }
    }

    // 4) Obtener datos del usuario
    const { data: usuario, error: errUsr } = await supabase
      .from("usuarios")
      .select("id, email, nombrecompleto, activo")
      .eq("id", usuarioId)
      .maybeSingle()

    if (errUsr || !usuario) {
      return { success: false, error: "notfound", message: "Usuario no encontrado." }
    }

    if (!usuario.activo) {
      return { success: false, error: "inactive", message: "La cuenta se encuentra inactiva." }
    }

    return {
      success: true,
      usuario: { id: usuario.id, nombrecompleto: usuario.nombrecompleto, email: usuario.email },
    }
  } catch (error) {
    console.error("Error en validarTokenPassword:", error)
    return { success: false, error: "server", message: "Error interno. Intenta de nuevo." }
  }
}

/* --------------------------------------------------
  cambiarPassword
  - Re-valida el token
  - Hashea la nueva contraseña con HashData (bcrypt)
  - Actualiza usuarios.password
  - Marca el token como activo=false (consumido)
-------------------------------------------------- */
export async function cambiarPassword(
  token: string,
  usuarioId: number,
  nuevaPassword: string,
  confirmarPassword: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    if (!nuevaPassword || nuevaPassword.length < 4) {
      return { success: false, error: "weak", message: "La contraseña debe tener al menos 4 caracteres." }
    }

    if (nuevaPassword !== confirmarPassword) {
      return { success: false, error: "mismatch", message: "Las contraseñas no coinciden." }
    }

    // Re-validar token
    const validacion = await validarTokenPassword(token, usuarioId)
    if (!validacion.success) {
      return { success: false, error: validacion.error, message: validacion.message }
    }

    // Hashear nueva contraseña
    const passwordHasheada = await HashData(nuevaPassword)

    // Actualizar tabla usuarios
    const { error: errUpd } = await supabase
      .from("usuarios")
      .update({ password: passwordHasheada })
      .eq("id", usuarioId)

    if (errUpd) {
      console.error("Error actualizando password:", errUpd)
      return { success: false, error: "server", message: "No se pudo actualizar la contraseña." }
    }

    // Marcar token como consumido
    await supabase.from("tokens").update({ activo: false }).eq("token", token)

    return { success: true, message: "Contraseña actualizada correctamente." }
  } catch (error) {
    console.error("Error en cambiarPassword:", error)
    return { success: false, error: "server", message: "Error interno. Intenta de nuevo." }
  }
}
