"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { HashData } from "@/app/actions/utilerias"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  --------------------
  Funciones Configuraciones
  --------------------
  * CONFIGURACION GENERAL
    - obtenerConfiguracion(hotelId?)
    - actualizarConfiguracion(data)

  * USUARIOS
    - obtenerUsuariosConfig()
    - actualizarUsuarioConfig(id, data)
    - crearUsuarioConfig(data)
    - resetPasswordUsuario(id, newPassword)

  * HOTELES
    - obtenerHotelesConfig()
    - actualizarHotelConfig(id, data)

  * ROLES
    - obtenerRoles()
================================================== */

/* ==================================================
  CONFIGURACION GENERAL
================================================== */

// Tipo para configuracion del sistema
export interface ConfiguracionSistema {
  id?: number
  clave: string
  valor: string
  descripcion?: string
  hotelid?: number | null
}

// Funcion: obtenerConfiguracion — obtiene la configuracion global o por hotel
export async function obtenerConfiguracion(
  hotelId?: number
): Promise<{ success: boolean; error: string; data: Record<string, string> | null }> {
  try {
    let query = supabase
      .from("configuraciones")
      .select("*")

    if (hotelId) {
      query = query.eq("hotelid", hotelId)
    } else {
      query = query.is("hotelid", null)
    }

    const { data, error } = await query

    if (error) {
      // Si la tabla no existe, devolver valores por defecto
      return {
        success: true,
        error: "",
        data: {
          iva_porcentaje: "16",
          moneda: "MXN",
          dias_validez_cotizacion: "15",
          email_notificaciones: "",
          horario_atencion: "09:00 - 18:00",
          hotel_default_nuevos_usuarios: "",
          notificaciones_email: "true",
          notificaciones_sistema: "true",
        },
      }
    }

    // Convertir array de clave:valor a Record
    const config: Record<string, string> = {}
    const defaults: Record<string, string> = {
      iva_porcentaje: "16",
      moneda: "MXN",
      dias_validez_cotizacion: "15",
      email_notificaciones: "",
      horario_atencion: "09:00 - 18:00",
      hotel_default_nuevos_usuarios: "",
      notificaciones_email: "true",
      notificaciones_sistema: "true",
    }

    // Apply defaults first
    Object.assign(config, defaults)

    // Override with DB values (usa 'clave' si existe, sino 'descripcion' como fallback)
    if (data && data.length > 0) {
      data.forEach((item: any) => {
        const key = item.clave || item.descripcion
        if (key) config[key] = item.valor
      })
    }

    return { success: true, error: "", data: config }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    // Return defaults on any error (table might not exist yet)
    return {
      success: true,
      error: "",
      data: {
        iva_porcentaje: "16",
        moneda: "MXN",
        dias_validez_cotizacion: "15",
        email_notificaciones: "",
        horario_atencion: "09:00 - 18:00",
        hotel_default_nuevos_usuarios: "",
        notificaciones_email: "true",
        notificaciones_sistema: "true",
      },
    }
  }
}

// Funcion: actualizarConfiguracion — upsert configuracion
export async function actualizarConfiguracion(
  datos: Record<string, string>,
  hotelId?: number
): Promise<{ success: boolean; error: string }> {
  try {
    // Upsert each key-value pair
    for (const [clave, valor] of Object.entries(datos)) {
      // Try to find by 'clave' first, then by 'descripcion' as fallback
      let existing: any = null

      const { data: byClave } = await supabase
        .from("configuraciones")
        .select("id")
        .eq("clave", clave)
        .maybeSingle()

      existing = byClave

      if (!existing) {
        const { data: byDesc } = await supabase
          .from("configuraciones")
          .select("id")
          .eq("descripcion", clave)
          .maybeSingle()
        existing = byDesc
      }

      if (existing) {
        const { error } = await supabase
          .from("configuraciones")
          .update({ valor, clave })
          .eq("id", existing.id)

        if (error) {
          return { success: false, error: `Error actualizando ${clave}: ${error.message}` }
        }
      } else {
        const { error } = await supabase
          .from("configuraciones")
          .insert({
            clave,
            descripcion: clave,
            valor,
            activo: true,
            hotelid: hotelId || null,
          })

        if (error) {
          console.warn(`No se pudo guardar configuracion ${clave}: ${error.message}`)
        }
      }
    }

    revalidatePath("/configuraciones")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarConfiguracion: " + errorMessage }
  }
}

/* ==================================================
  USUARIOS — Funciones para gestion desde configuraciones
================================================== */

// Funcion: obtenerUsuariosConfig — lista completa con rol y hotel para la tabla de config
export async function obtenerUsuariosConfig(): Promise<{
  success: boolean
  error: string
  data: any[] | null
}> {
  try {
    // Obtener usuarios desde la vista
    const { data: usuarios, error } = await supabase
      .from("vw_ousuarios")
      .select("*")
      .order("nombrecompleto", { ascending: true })

    if (error) {
      // Fallback: query directly from usuarios table
      const { data: usuariosDirecto, error: errDirecto } = await supabase
        .from("usuarios")
        .select("id, nombrecompleto, usuario, email, telefono, rolid, activo, ultimoingreso, fechacreacion, imgurl")
        .order("nombrecompleto", { ascending: true })

      if (errDirecto) {
        return { success: false, error: "Error obteniendo usuarios: " + errDirecto.message, data: null }
      }

      // Get roles to map
      const { data: roles } = await supabase.from("roles").select("id, nombre")
      const rolesMap: Record<number, string> = {}
      ;(roles || []).forEach((r: any) => { rolesMap[r.id] = r.nombre })

      // Get hotel assignments
      const { data: asignaciones } = await supabase
        .from("usuariosxhotel")
        .select("usuarioid, hotelid")

      const hotelMap: Record<number, number[]> = {}
      ;(asignaciones || []).forEach((a: any) => {
        if (!hotelMap[a.usuarioid]) hotelMap[a.usuarioid] = []
        hotelMap[a.usuarioid].push(a.hotelid)
      })

      // Get hotel names
      const { data: hoteles } = await supabase.from("hoteles").select("id, nombre")
      const hotelNombres: Record<number, string> = {}
      ;(hoteles || []).forEach((h: any) => { hotelNombres[h.id] = h.nombre })

      const usuariosConRol = (usuariosDirecto || []).map((u: any) => ({
        ...u,
        rol: rolesMap[u.rolid] || "Sin rol",
        hotelesids: hotelMap[u.id] || [],
        hotelesNombres: (hotelMap[u.id] || []).map((hid: number) => hotelNombres[hid] || "").filter(Boolean),
      }))

      return { success: true, error: "", data: usuariosConRol }
    }

    // If view works, enrich with hotel assignments
    const { data: asignaciones } = await supabase
      .from("usuariosxhotel")
      .select("usuarioid, hotelid")

    const hotelMap: Record<number, number[]> = {}
    ;(asignaciones || []).forEach((a: any) => {
      if (!hotelMap[a.usuarioid]) hotelMap[a.usuarioid] = []
      hotelMap[a.usuarioid].push(a.hotelid)
    })

    const { data: hoteles } = await supabase.from("hoteles").select("id, nombre")
    const hotelNombres: Record<number, string> = {}
    ;(hoteles || []).forEach((h: any) => { hotelNombres[h.id] = h.nombre })

    // Get roles
    const { data: roles } = await supabase.from("roles").select("id, nombre")
    const rolesMap: Record<number, string> = {}
    ;(roles || []).forEach((r: any) => { rolesMap[r.id] = r.nombre })

    const usuariosEnriquecidos = (usuarios || []).map((u: any) => {
      const uid = u.usuarioid || u.id
      return {
        ...u,
        id: uid,
        rol: u.rol || rolesMap[u.rolid] || "Sin rol",
        hotelesids: hotelMap[uid] || [],
        hotelesNombres: (hotelMap[uid] || []).map((hid: number) => hotelNombres[hid] || "").filter(Boolean),
      }
    })

    return { success: true, error: "", data: usuariosEnriquecidos }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerUsuariosConfig: " + errorMessage, data: null }
  }
}

// Funcion: crearUsuarioConfig — crear usuario con password hasheada
export async function crearUsuarioConfig(datos: {
  nombrecompleto: string
  email: string
  usuario: string
  password: string
  telefono?: string
  rolid: number
  hotelids?: number[]
}): Promise<{ success: boolean; error: string; data: { id: number } | null }> {
  try {
    // Validaciones
    if (!datos.nombrecompleto || datos.nombrecompleto.trim() === "") {
      return { success: false, error: "El nombre completo es requerido", data: null }
    }
    if (!datos.email || datos.email.trim() === "") {
      return { success: false, error: "El email es requerido", data: null }
    }
    if (!datos.password || datos.password.trim() === "") {
      return { success: false, error: "La contrasena es requerida", data: null }
    }
    if (datos.password.length < 6) {
      return { success: false, error: "La contrasena debe tener al menos 6 caracteres", data: null }
    }
    if (!datos.rolid) {
      return { success: false, error: "El rol es requerido", data: null }
    }

    // Verificar duplicados
    const { data: existente } = await supabase
      .from("usuarios")
      .select("id")
      .or(`email.eq.${datos.email},usuario.eq.${datos.usuario}`)
      .maybeSingle()

    if (existente) {
      return { success: false, error: "Ya existe un usuario con ese email o nombre de usuario", data: null }
    }

    // Hashear password
    const passwordHash = await HashData(datos.password)

    // Insertar usuario
    const { data, error } = await supabase
      .from("usuarios")
      .insert({
        nombrecompleto: datos.nombrecompleto,
        email: datos.email,
        usuario: datos.usuario,
        password: passwordHash,
        telefono: datos.telefono || null,
        rolid: datos.rolid,
        activo: true,
        fechacreacion: new Date().toISOString().split("T")[0],
      })
      .select("id")
      .single()

    if (error) {
      return { success: false, error: "Error creando usuario: " + error.message, data: null }
    }

    // Asignar hoteles si se proporcionaron
    if (datos.hotelids && datos.hotelids.length > 0 && data) {
      const asignaciones = datos.hotelids.map((hotelid) => ({
        usuarioid: data.id,
        hotelid,
      }))

      await supabase.from("usuariosxhotel").insert(asignaciones)
    }

    revalidatePath("/configuraciones")
    return { success: true, error: "", data: { id: data.id } }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en crearUsuarioConfig: " + errorMessage, data: null }
  }
}

// Funcion: actualizarUsuarioConfig — actualizar usuario (rol, hotel, activo)
export async function actualizarUsuarioConfig(
  id: number,
  datos: {
    nombrecompleto?: string
    email?: string
    usuario?: string
    telefono?: string
    rolid?: number
    activo?: boolean
    hotelids?: number[]
  }
): Promise<{ success: boolean; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID de usuario requerido" }
    }

    // Build update object (only fields provided)
    const updateData: any = {}
    if (datos.nombrecompleto !== undefined) updateData.nombrecompleto = datos.nombrecompleto
    if (datos.email !== undefined) updateData.email = datos.email
    if (datos.usuario !== undefined) updateData.usuario = datos.usuario
    if (datos.telefono !== undefined) updateData.telefono = datos.telefono
    if (datos.rolid !== undefined) updateData.rolid = datos.rolid
    if (datos.activo !== undefined) updateData.activo = datos.activo

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("usuarios")
        .update(updateData)
        .eq("id", id)

      if (error) {
        return { success: false, error: "Error actualizando usuario: " + error.message }
      }
    }

    // Update hotel assignments if provided
    if (datos.hotelids !== undefined) {
      // Delete existing assignments
      await supabase.from("usuariosxhotel").delete().eq("usuarioid", id)

      // Insert new assignments
      if (datos.hotelids.length > 0) {
        const asignaciones = datos.hotelids.map((hotelid) => ({
          usuarioid: id,
          hotelid,
        }))

        const { error: errorHoteles } = await supabase
          .from("usuariosxhotel")
          .insert(asignaciones)

        if (errorHoteles) {
          return { success: false, error: "Error asignando hoteles: " + errorHoteles.message }
        }
      }
    }

    revalidatePath("/configuraciones")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarUsuarioConfig: " + errorMessage }
  }
}

// Funcion: resetPasswordUsuario — cambiar contrasena de un usuario
export async function resetPasswordUsuario(
  id: number,
  newPassword: string
): Promise<{ success: boolean; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID de usuario requerido" }
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "La nueva contrasena debe tener al menos 6 caracteres" }
    }

    const passwordHash = await HashData(newPassword)

    const { error } = await supabase
      .from("usuarios")
      .update({ password: passwordHash })
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error reseteando contrasena: " + error.message }
    }

    revalidatePath("/configuraciones")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en resetPasswordUsuario: " + errorMessage }
  }
}

/* ==================================================
  HOTELES — Funciones para gestion desde configuraciones
================================================== */

// Funcion: obtenerHotelesConfig — lista de hoteles con todos sus datos
export async function obtenerHotelesConfig(): Promise<{
  success: boolean
  error: string
  data: any[] | null
}> {
  try {
    const { data, error } = await supabase
      .from("vw_ohoteles")
      .select("*")
      .order("nombre", { ascending: true })

    if (error) {
      // Fallback direct
      const { data: directData, error: directError } = await supabase
        .from("hoteles")
        .select("*")
        .order("nombre", { ascending: true })

      if (directError) {
        return { success: false, error: "Error obteniendo hoteles: " + directError.message, data: null }
      }

      return { success: true, error: "", data: directData }
    }

    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerHotelesConfig: " + errorMessage, data: null }
  }
}

// Funcion: actualizarHotelConfig — actualizar informacion del hotel
export async function actualizarHotelConfig(
  id: number,
  datos: {
    nombre?: string
    acronimo?: string
    telefono?: string
    email?: string
    direccion?: string
    website?: string
    activo?: boolean
    activoevento?: boolean
    activocentroconsumo?: boolean
  }
): Promise<{ success: boolean; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID de hotel requerido" }
    }

    const updateData: any = {}
    if (datos.nombre !== undefined) updateData.nombre = datos.nombre
    if (datos.acronimo !== undefined) updateData.acronimo = datos.acronimo
    if (datos.telefono !== undefined) updateData.telefono = datos.telefono
    if (datos.email !== undefined) updateData.email = datos.email
    if (datos.direccion !== undefined) updateData.direccion = datos.direccion
    if (datos.website !== undefined) updateData.website = datos.website
    if (datos.activo !== undefined) updateData.activo = datos.activo
    if (datos.activoevento !== undefined) updateData.activoevento = datos.activoevento
    if (datos.activocentroconsumo !== undefined) updateData.activocentroconsumo = datos.activocentroconsumo

    const { error } = await supabase
      .from("hoteles")
      .update(updateData)
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error actualizando hotel: " + error.message }
    }

    revalidatePath("/configuraciones")
    revalidatePath("/hoteles")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarHotelConfig: " + errorMessage }
  }
}

/* ==================================================
  ROLES
================================================== */

// Funcion: obtenerRoles — lista de roles disponibles
export async function obtenerRoles(): Promise<{
  success: boolean
  error: string
  data: Array<{ id: number; nombre: string }> | null
}> {
  try {
    const { data, error } = await supabase
      .from("roles")
      .select("id, nombre")
      .order("id", { ascending: true })

    if (error) {
      // Fallback: return hardcoded roles
      return {
        success: true,
        error: "",
        data: [
          { id: 1, nombre: "Admin Principal" },
          { id: 2, nombre: "Admin General" },
          { id: 3, nombre: "Gerente" },
          { id: 4, nombre: "Vendedor" },
        ],
      }
    }

    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    return {
      success: true,
      error: "",
      data: [
        { id: 1, nombre: "Admin Principal" },
        { id: 2, nombre: "Admin General" },
        { id: 3, nombre: "Gerente" },
        { id: 4, nombre: "Vendedor" },
      ],
    }
  }
}
