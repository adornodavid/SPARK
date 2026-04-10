"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import type { oUsuario } from "@/types/usuarios"
import type { ddlItem } from "@/types/common"
import { imagenSubir, HashData } from "@/app/actions/utilerias"
import { revalidatePath } from "next/cache"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabase variable

/* ==================================================
	  --------------------
  Objetos / Clases
  --------------------
  * Objetos
    - objetoUsuario / oUsuario (Individual)
    - objetoUsuarios / oUsuarios (Listado / Array)

  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearUsuario / insUsuario

  * SELECTS: READ/OBTENER/SELECT
    - obtenerUsuarios / selUsuarios

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarUsuario / updUsuario

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarUsuario / delUsuario

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoUsuario / actUsuario
    - listaDesplegableUsuarios / ddlUsuarios
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoUsuario / oUsuario (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoUsuario(
  usuarioid = -1,
  nombrecompleto = "",
  email = "",
  usuario = "",
  rolid = -1,
  hotelid = -1,
): Promise<{ success: boolean; error: string; data: oUsuario | null }> {
  try {
    let query = supabase.from("vw_ousuarios").select("*")

    // Agregar filtros condicionales
    if (usuarioid !== -1) {
      query = query.eq("usuarioid", usuarioid)
    }
    if (nombrecompleto !== "") {
      query = query.ilike("nombrecompleto", `%${nombrecompleto}%`)
    }
    if (usuario !== "") {
      query = query.ilike("usuario", `%${usuario}%`)
    }
    if (email !== "") {
      query = query.ilike("email", `%${email}%`)
    }
    if (rolid !== -1) {
      query = query.eq("rolid", rolid)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      return {
        success: false,
        error: "Error en la funcion objetoUsuario de actions/usuarios: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oUsuario }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoUsuario: " + errorMessage, data: null }
  }
}

// Función: objetoUsuarios / oUsuarios (Listado): Esta Función crea un listado de objetos/clases, es un array
export async function objetoUsuarios(
  nombrecompleto = "",
  email = "",
  usuario = "",
  rolid = -1,
  hotelid = -1,
): Promise<{ success: boolean; error: string; data: oUsuario[] | null }> {
  try {
    let query = supabase.from("vw_ousuarios").select("*")

    // Agregar filtros condicionales
    if (nombrecompleto !== "") {
      query = query.ilike("nombrecompleto", `%${nombrecompleto}%`)
    }
    if (usuario !== "") {
      query = query.ilike("usuario", `%${usuario}%`)
    }
    if (email !== "") {
      query = query.ilike("email", `%${email}%`)
    }
    if (rolid !== -1) {
      query = query.eq("rolid", rolid)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en la funcion objetoUsuarios de actions/usuarios: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oUsuario[] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoUsuarios: " + errorMessage, data: null }
  }
}
/*==================================================
    VALIDACIONES
================================================== */
// Función: validarUsuarioUnico: Verifica si un usuario o email ya existe en la tabla usuarios
export async function validarUsuarioUnico(
  campo: "usuario" | "email",
  valor: string,
): Promise<{ success: boolean; existe: boolean; error: string }> {
  try {
    if (!valor || valor.trim().length < 3) {
      return { success: false, existe: false, error: "El valor debe tener al menos 3 caracteres" }
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id")
      .eq(campo, valor.trim())
      .maybeSingle()

    if (error) {
      return { success: false, existe: false, error: "Error al validar: " + error.message }
    }

    return { success: true, existe: !!data, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, existe: false, error: "Error en validarUsuarioUnico: " + errorMessage }
  }
}

/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearUsuario / insUsuario: Función para insertar
export async function crearUsuario(formData: FormData) {
  try {
    // Paso 1: Pasar los datos del formData a variables con su tipo de dato
    const nombrecompleto = formData.get("nombrecompleto") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const telefono = formData.get("telefono") as string
    const celular = formData.get("celular") as string
    const puesto = formData.get("puesto") as string
    const usuario = formData.get("usuario") as string
    const rolid = Number.parseInt(formData.get("rolid") as string)
    const fecha = new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
    const activo = true

    if (!nombrecompleto || nombrecompleto.trim() === "") {
      return { success: false, error: "El nombre completo es requerido" }
    }
    if (!email || email.trim() === "") {
      return { success: false, error: "El email es requerido" }
    }
    if (!password || password.trim() === "") {
      return { success: false, error: "La contraseña es requerida" }
    }
    if (!rolid || isNaN(rolid)) {
      return { success: false, error: "El rol es requerido" }
    }

    const passwordhash = await HashData(password)

    // Paso 2: Validar si existe antes de proceder
    const { data: usuarioExistente, error: errorValidacion } = await supabase
      .from("vw_usuarios")
      .select("*")
      .or(`email.eq.${email},usuario.eq.${usuario},nombrecompleto.eq.${nombrecompleto}`)
      .maybeSingle()

    if (errorValidacion) {
      return {
        success: false,
        error: "Error al validar usuario existente en la fubncion crearUsuario: " + errorValidacion.message,
      }
    }

    if (usuarioExistente) {
      return {
        success: false,
        error:
          "Ya existe un usuario con el mismo email, usuario o nombre completo, el proceso de la función crearUsuario se cancelo, favor de verificar.",
      }
    }

    // Paso 3: Subir imagen para obtener su url
    let imagenurl = ""
    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, formData.get("nombrecompleto") as string, "usuarios")

      if (!resultadoImagen.success) {
        return {
          success: false,
          error: resultadoImagen.error || "Error al subir la imagen en la funcion crearUsuario de actions/usuarios",
        }
      }

      imagenurl = resultadoImagen.url || ""
    }

    // Paso 4: Ejecutar query de INSERT
    const { data, error } = await supabase
      .from("usuarios")
      .insert({
        nombrecompleto,
        email,
        password: passwordhash,
        telefono: telefono || null,
        celular: celular || null,
        puesto: puesto || null,
        usuario,
        rolid,
        imgurl: imagenurl,
        fechacreacion: fecha,
        activo,
      })
      .select("id")
      .single()

    if (error) {
      return { success: false, error: "Error al crear usuario: " + error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del usuario creado en la funcion crearUsuario" }
    }

    // Paso 5: Regresar resultado
    return { success: true, data: data.id }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actions/usuarios en la funcion crearUsuario: " + errorMessage }
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerUsuarios / selUsuarios: Función para obtener
export async function obtenerUsuarios(
  id = -1,
  busqueda = "",
  rolid = -1,
  activo = "Todos",
): Promise<{ success: boolean; error: string; data: unknown }> {
  try {
    // Query principal
    let query = supabase.from("vw_ousuarios").select("*")

    // Filtros
    if (id !== -1) {
      query = query.eq("usuarioid", id)
    }
    if (busqueda !== "") {
      query = query.or(`nombrecompleto.ilike.%${busqueda}%,usuario.ilike.%${busqueda}%,email.ilike.%${busqueda}%`)
    }
    if (rolid !== -1) {
      query = query.eq("rolid", rolid)
    }
    if (activo !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(activo)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(activo)

      if (isActive) {
        query = query.eq("activo", true)
      } else if (isInactive) {
        query = query.eq("activo", false)
      }
    }

    // Ejecutar query
    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en la funcion obtenerUsuarios de actions/usuarios: " + error.message,
        data: null,
      }
    }

    // Regreso de data
    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerUsuarios: " + errorMessage, data: null }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Función: actualizarUsuario / updUsuario: Función para actualizar
export async function actualizarUsuario(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const idString = formData.get("id") as string
    const id = Number(idString)
    const nombrecompleto = formData.get("nombrecompleto") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const telefono = formData.get("telefono") as string
    const usuario = formData.get("usuario") as string
    const rolid = Number(formData.get("rolid") as string)
    const fecha = new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
    const imgurl = formData.get("imgurl") as string

    const passwordhash = await HashData(password)

    // Paso 2: Validar variables obligatorias
    if (!nombrecompleto || nombrecompleto.length < 3) {
      return { success: false, error: "El parametro nombrecompleto, esta incompleto. Favor de verificar." }
    }
    if (!email || email.length < 3) {
      return { success: false, error: "El parametro email, esta incompleto. Favor de verificar." }
    }
    if (!usuario || usuario.length < 3) {
      return { success: false, error: "El parametro usuario, esta incompleto. Favor de verificar." }
    }

    const { data: usuarioExistente, error: errorExistencia } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      return { success: false, error: "Error validando existencia del usuario: " + errorExistencia.message }
    }

    if (!usuarioExistente) {
      return { success: false, error: "El usuario con el id proporcionado no existe" }
    }

    const { data: duplicado, error: errorDuplicado } = await supabase
      .from("vw_usuarios")
      .select("*")
      .or(`email.eq.${email},usuario.eq.${usuario},nombrecompleto.eq.${nombrecompleto}`)
      .neq("usuarioid", id)
      .maybeSingle()

    if (errorDuplicado) {
      return { success: false, error: "Error al validar duplicados: " + errorDuplicado.message }
    }

    if (duplicado) {
      return {
        success: false,
        error: "Ya existe otro usuario con el mismo email, usuario o nombre completo",
      }
    }

    // Paso 3: Subir imagen para obtener su url
    let imagenurl = ""
    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombrecompleto, "usuarios")
      if (!resultadoImagen.success) {
        return { success: false, error: resultadoImagen.error }
      } else {
        imagenurl = resultadoImagen.url || ""
      }
    } else {
      imagenurl = imgurl || ""
    }

    const updateData: any = {
      nombrecompleto,
      email,
      usuario,
      imgurl: imagenurl,
      telefono,
      rolid,
    }

    if (password && password.trim() !== "") {
      updateData.password = passwordhash
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase.from("usuarios").update(updateData).eq("id", id).select("id").single()

    // Return error
    if (error) {
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del usuario actualizado" }
    }

    revalidatePath("/usuarios")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarUsuario de actions/Usuarios: " + errorMessage,
    }
  }
}

// Función: obtenerUsuarioDetalle: Obtiene un usuario individual con sus hoteles asignados (nombres)
export async function obtenerUsuarioDetalle(id: number): Promise<{
  success: boolean
  error: string
  data: {
    usuarioid: number
    nombrecompleto: string
    usuario: string
    email: string
    telefono: string | null
    celular: string | null
    puesto: string | null
    imgurl: string | null
    rol: string
    rolid: number
    activo: boolean
    ultimoingreso: string | null
    fechacreacion: string | null
    hoteles: { hotelid: number; nombre: string }[]
  } | null
}> {
  try {
    // Obtener datos del usuario
    const { data: usuarioData, error: errorUsuario } = await supabase
      .from("vw_ousuarios")
      .select("*")
      .eq("usuarioid", id)
      .maybeSingle()

    if (errorUsuario) {
      return { success: false, error: "Error al obtener usuario: " + errorUsuario.message, data: null }
    }

    if (!usuarioData) {
      return { success: false, error: "Usuario no encontrado", data: null }
    }

    // Obtener columna activo de la tabla usuarios (no está en la vista)
    const { data: activoData } = await supabase
      .from("usuarios")
      .select("activo")
      .eq("id", id)
      .maybeSingle()

    // Obtener hoteles asignados
    const { data: hotelesData, error: errorHoteles } = await supabase
      .from("usuariosxhotel")
      .select("hotelid, hoteles(nombre)")
      .eq("usuarioid", id)

    const hoteles = (hotelesData || []).map((h: any) => ({
      hotelid: h.hotelid,
      nombre: h.hoteles?.nombre || "Sin nombre",
    }))

    return {
      success: true,
      error: "",
      data: {
        usuarioid: usuarioData.usuarioid,
        nombrecompleto: usuarioData.nombrecompleto,
        usuario: usuarioData.usuario,
        email: usuarioData.email,
        telefono: usuarioData.telefono,
        celular: usuarioData.celular,
        puesto: usuarioData.puesto,
        imgurl: usuarioData.imgurl,
        rol: usuarioData.rol,
        rolid: usuarioData.rolid,
        activo: activoData?.activo ?? false,
        ultimoingreso: usuarioData.ultimoingreso,
        fechacreacion: usuarioData.fechacreacion,
        hoteles,
      },
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerUsuarioDetalle: " + errorMessage, data: null }
  }
}

// Función: actualizarAccesoUsuario: Actualiza usuario, email y rol validando unicidad
export async function actualizarAccesoUsuario(
  id: number,
  usuario: string,
  email: string,
  rolid: number,
): Promise<{ success: boolean; error: string }> {
  try {
    if (!usuario.trim() && !email.trim()) {
      return { success: false, error: "Al menos Usuario o Email debe tener datos" }
    }

    // Validar unicidad excluyendo el usuario actual
    const conditions: string[] = []
    if (usuario.trim()) conditions.push(`usuario.eq.${usuario}`)
    if (email.trim()) conditions.push(`email.eq.${email}`)

    const { data: duplicado, error: errorDuplicado } = await supabase
      .from("usuarios")
      .select("id")
      .or(conditions.join(","))
      .neq("id", id)
      .maybeSingle()

    if (errorDuplicado) {
      return { success: false, error: "Error al validar duplicados: " + errorDuplicado.message }
    }

    if (duplicado) {
      return { success: false, error: "El usuario o email ya están registrados por otro usuario" }
    }

    const { error } = await supabase
      .from("usuarios")
      .update({ usuario, email, rolid })
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar: " + error.message }
    }

    revalidatePath("/admin/usuarios")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarAccesoUsuario: " + errorMessage }
  }
}

// Función: actualizarInfoBasicaUsuario: Actualiza nombrecompleto, puesto, telefono y celular
export async function actualizarInfoBasicaUsuario(
  id: number,
  nombrecompleto: string,
  puesto: string,
  telefono: string,
  celular: string,
): Promise<{ success: boolean; error: string }> {
  try {
    if (!nombrecompleto.trim()) {
      return { success: false, error: "El nombre completo es requerido" }
    }

    const { error } = await supabase
      .from("usuarios")
      .update({ nombrecompleto: nombrecompleto.trim(), puesto: puesto.trim(), telefono: telefono.trim(), celular: celular.trim() })
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar: " + error.message }
    }

    revalidatePath("/admin/usuarios")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarInfoBasicaUsuario: " + errorMessage }
  }
}

// Función: actualizarPasswordUsuario: Actualiza la contraseña hasheada
export async function actualizarPasswordUsuario(
  id: number,
  password: string,
): Promise<{ success: boolean; error: string }> {
  try {
    if (!password.trim()) {
      return { success: false, error: "La contraseña no puede estar vacía" }
    }

    const passwordHash = await HashData(password)

    const { error } = await supabase
      .from("usuarios")
      .update({ password: passwordHash })
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar contraseña: " + error.message }
    }

    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarPasswordUsuario: " + errorMessage }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarUsuario / delUsuario: Función para eliminar

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoUsuario / actUsuario: Función especial para cambiar columna activo, el valor debe ser boolean
export async function estatusActivoUsuario(id: number, activo: boolean): Promise<{ success: boolean; error: string }> {
  try {
    const { data: usuarioExistente, error: errorExistencia } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      return { success: false, error: "Error validando existencia del usuario: " + errorExistencia.message }
    }

    if (!usuarioExistente) {
      return { success: false, error: "El usuario con el id proporcionado no existe" }
    }

    const { error } = await supabase.from("usuarios").update({ activo: activo }).eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/usuarios")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno del servidor: " + errorMessage }
  }
}

// Función: listaDesplegableUsuarios / ddlUsuarios: Función que se utiliza para los dropdownlist
export async function listaDesplegableUsuarios(id = -1, descripcion = "") {
  try {
    // Query principal
    let query = supabase.from("vw_usuarios").select("usuarioid, nombrecompleto").eq("activo", true)

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("usuarioid", id)
    }
    if (descripcion !== "") {
      query = query.ilike("nombrecompleto", `%${descripcion}%`)
    }

    query = query.order("nombrecompleto", { ascending: true }).limit(100)

    // Varaibles y resultados del query
    const { data: usuarios, error } = await query

    if (error) {
      return { success: false, error: "Error obteniendo lista de usuarios: " + error.message }
    }

    if (!usuarios || usuarios.length === 0) {
      return { success: true, data: [] }
    }

    const data: ddlItem[] = usuarios.map((usuario) => ({
      value: usuario.usuarioid.toString(),
      text: usuario.nombrecompleto,
    }))

    return { success: true, data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo lista desplegable de usuarios: " + errorMessage }
  }
}

/*==================================================
  RELACIONES: USUARIOS x HOTEL
================================================== */

// Función: obtenerUsuariosXHotel: Obtiene relaciones usuario-hotel con joins a usuarios y hoteles
export async function obtenerUsuariosXHotel(
  usuarioid = -1,
  hotelid = -1,
): Promise<{
  success: boolean
  error: string
  data: {
    idrec: number
    usuarioid: number
    usuario: string
    hotelid: number
    acronimo: string
    hotel: string
    activo: boolean
  }[] | null
}> {
  try {
    let query = supabase
      .from("usuariosxhotel")
      .select("idrec, usuarioid, hotelid, activo")

    if (usuarioid > 0) {
      query = query.eq("usuarioid", usuarioid)
    }
    if (hotelid > 0) {
      query = query.eq("hotelid", hotelid)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: "Error en obtenerUsuariosXHotel: " + error.message, data: null }
    }

    if (!data || data.length === 0) {
      return { success: true, error: "", data: [] }
    }

    // Obtener ids únicos para los JOINs manuales
    const usuarioIds = [...new Set(data.map((r: any) => r.usuarioid))]
    const hotelIds = [...new Set(data.map((r: any) => r.hotelid))]

    const [resUsuarios, resHoteles] = await Promise.all([
      supabase.from("usuarios").select("id, nombrecompleto").in("id", usuarioIds),
      supabase.from("hoteles").select("id, acronimo, nombre").in("id", hotelIds),
    ])

    const usuariosMap = new Map((resUsuarios.data || []).map((u: any) => [u.id, u.nombrecompleto]))
    const hotelesMap = new Map((resHoteles.data || []).map((h: any) => [h.id, { acronimo: h.acronimo, nombre: h.nombre }]))

    const mapped = data.map((row: any) => ({
      idrec: row.idrec,
      usuarioid: row.usuarioid,
      usuario: usuariosMap.get(row.usuarioid) || "",
      hotelid: row.hotelid,
      acronimo: hotelesMap.get(row.hotelid)?.acronimo || "",
      hotel: hotelesMap.get(row.hotelid)?.nombre || "",
      activo: row.activo,
    }))

    return { success: true, error: "", data: mapped }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerUsuariosXHotel: " + errorMessage, data: null }
  }
}

// Función: agregarUsuarioXHotel: Inserta relación usuario-hotel
export async function agregarUsuarioXHotel(
  usuarioid: number,
  hotelid: number,
): Promise<{ success: boolean; error: string }> {
  try {
    // Validar que no exista ya la relación
    const { data: existente } = await supabase
      .from("usuariosxhotel")
      .select("idrec")
      .eq("usuarioid", usuarioid)
      .eq("hotelid", hotelid)
      .maybeSingle()

    if (existente) {
      return { success: false, error: "El usuario ya tiene asignado este hotel" }
    }

    const { error } = await supabase
      .from("usuariosxhotel")
      .insert({ usuarioid, hotelid, activo: true, fechacreacion: new Date().toISOString().split("T")[0] })

    if (error) {
      return { success: false, error: "Error al agregar hotel: " + error.message }
    }

    revalidatePath("/admin/usuarios")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en agregarUsuarioXHotel: " + errorMessage }
  }
}

// Función: eliminarUsuarioXHotel: Elimina relación usuario-hotel por idrec
export async function eliminarUsuarioXHotel(idrec: number): Promise<{ success: boolean; error: string }> {
  try {
    const { error } = await supabase
      .from("usuariosxhotel")
      .delete()
      .eq("idrec", idrec)

    if (error) {
      return { success: false, error: "Error al eliminar relación: " + error.message }
    }

    revalidatePath("/admin/usuarios")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en eliminarUsuarioXHotel: " + errorMessage }
  }
}
