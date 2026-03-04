"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import type { oUsuario } from "@/types/usuarios.types"
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
      console.error("Error en la funcion objetoUsuario (Individual) de actions/usuarios : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoUsuario de actions/usuarios: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oUsuario }
  } catch (error: unknown) {
    console.error("Error en app/actions/usuarios en objetoUsuario (Individual): ", error)
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
      console.error("Error en la funcion objetoUsuarios (Listado) de actions/usuarios : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoUsuarios de actions/usuarios: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oUsuario[] }
  } catch (error: unknown) {
    console.error("Error en app/actions/usuarios en objetoUsuarios (Listado): ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoUsuarios: " + errorMessage, data: null }
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
      console.error("Error en validación de usuario existente de la funcion crearUsuario: ", errorValidacion)
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
        telefono,
        usuario,
        rolid,
        imgurl: imagenurl,
        fechacreacion: fecha,
        activo,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error en INSERT de crearUsuario: ", error)
      return { success: false, error: "Error al crear usuario: " + error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del usuario creado en la funcion crearUsuario" }
    }

    // Paso 5: Regresar resultado
    return { success: true, data: data.id }
  } catch (error: unknown) {
    console.error("Error en actions/usuarios en la funcion crearUsuario: ", error)
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
  nombrecompleto = "",
  usuario = "",
  email = "",
  rolid = -1,
  activo = "Todos",
): Promise<{ success: boolean; error: string; data: unknown }> {
  try {
    // Query principal
    let query = supabase.from("vw_usuarios").select("*")

    // Filtros
    if (id !== -1) {
      query = query.eq("usuarioid", id)
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
      console.error("Error en la funcion obtenerUsuarios de actions/usuarios: ", error)
      return {
        success: false,
        error: "Error en la funcion obtenerUsuarios de actions/usuarios: " + error.message,
        data: null,
      }
    }

    // Regreso de data
    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    console.error("Error en app/actions/usuarios en obtenerUsuarios: ", error)
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
      console.error("Error validando existencia del usuario:", errorExistencia)
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
      console.error("Error validando duplicados:", errorDuplicado)
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
      console.error("Error actualizando usuario en query en actualizarUsuario de actions/usuarios:", error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del usuario actualizado" }
    }

    revalidatePath("/usuarios")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error: unknown) {
    console.error("Error en actualizarUsuario de actions/Usuario: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarUsuario de actions/Usuarios: " + errorMessage,
    }
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
      console.error("Error validando existencia del usuario en estatusActivoUsuario:", errorExistencia)
      return { success: false, error: "Error validando existencia del usuario: " + errorExistencia.message }
    }

    if (!usuarioExistente) {
      return { success: false, error: "El usuario con el id proporcionado no existe" }
    }

    const { error } = await supabase.from("usuarios").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error(
        "Error actualizando estatus activo del usuario en estatusActivoUsuario de app/actions/usuarios:",
        error,
      )
      return { success: false, error: error.message }
    }

    console.log(`[v0] Usuario ${id} actualizado a activo: ${activo}`)

    revalidatePath("/usuarios")
    return { success: true, error: "" }
  } catch (error: unknown) {
    console.error("Error en estatusActivoUsuario de app/actions/usuarios: ", error)
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
      console.error("Error obteniendo la lista desplegable de usuarios:", error)
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
    console.error("Error en listaDesplegableUsuarios:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo lista desplegable de usuarios: " + errorMessage }
  }
}
