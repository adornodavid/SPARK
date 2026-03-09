"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import type { oSalon } from "@/types/salones"
import type { ddlItem } from "@/types/common"
import { revalidatePath } from "next/cache"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
	  --------------------
  Objetos / Clases
  --------------------
  * Objetos
    - objetoSalon / oSalon (Individual)
    - objetoSalones / oSalones (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearSalon / insSalon

  * SELECTS: READ/OBTENER/SELECT
    - obtenerSalones / selSalones

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarSalon / updSalon

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarSalon / delSalon

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoSalon / actSalon
    - listaDesplegableSalones / ddlSalones
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoSalon / oSalon (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoSalon(
  id = -1,
  nombre = "",
  hotelid = -1,
  activo = "Todos",
): Promise<{ success: boolean; error: string; data: oSalon | null }> {
  try {
    let query = supabase.from("vw_osalones").select("*")

    // Agregar filtros condicionales
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
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

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error("Error en la funcion objetoSalon (Individual) de actions/salones : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoSalon de actions/salones: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oSalon }
  } catch (error: unknown) {
    console.error("Error en app/actions/salones en objetoSalon (Individual): ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoSalon: " + errorMessage, data: null }
  }
}

// Función: objetoSalones / oSalones (Listado): Esta Función crea un listado de objetos/clases, es un array
export async function objetoSalones(
  nombre = "",
  hotelid = -1,
  activo = "Todos",
): Promise<{ success: boolean; error: string; data: oSalon[] | null }> {
  try {
    let query = supabase.from("vw_osalones").select("*")

    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
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

    const { data, error } = await query

    if (error) {
      console.error("Error en la funcion objetoSalones (Listado) de actions/salones : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoSalones de actions/salones: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oSalon[] }
  } catch (error: unknown) {
    console.error("Error en app/actions/salones en objetoSalones (Listado): ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoSalones: " + errorMessage, data: null }
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerSalones / selSalones: Función para obtener
export async function obtenerSalones(
  id = -1,
  nombre = "",
  hotelid = -1,
  activo = "Todos",
  capacidad = -1,
): Promise<{ success: boolean; error: string; data: unknown }> {
  try {
    // Query principal - usa vw_osalones para incluir nombre del hotel
    let query = supabase.from("vw_osalones").select("*")

    // Agregar filtros condicionales
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
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

    // Filtro de capacidad: la capacidad seleccionada debe ser menor a cantidadmaxima
    if (capacidad !== -1) {
      query = query.gte("capacidadmaxima", capacidad)
    }

    // Ejecutar query
    const { data, error } = await query

    if (error) {
      console.error("Error en la funcion obtenerSalones de actions/salones: ", error)
      return {
        success: false,
        error: "Error en la funcion obtenerSalones de actions/salones: " + error.message,
        data: null,
      }
    }

    // Regreso de data
    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    console.error("Error en app/actions/salones en obtenerSalones: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerSalones: " + errorMessage, data: null }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Función: actualizarSalon / updSalon: Función para actualizar
export async function actualizarSalon(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const id = Number(formData.get("id") as string)
    const hotelid = Number(formData.get("hotelid") as string)
    const nombre = formData.get("nombre") as string
    const descripcion = formData.get("descripcion") as string
    const longitud = Number(formData.get("longitud") as string)
    const ancho = Number(formData.get("ancho") as string)
    const altura = Number(formData.get("altura") as string)
    const aream2 = Number(formData.get("aream2") as string)
    const capacidadminima = Number(formData.get("capacidadminima") as string)
    const capacidadmaxima = Number(formData.get("capacidadmaxima") as string)
    const precioporhora = Number(formData.get("precioporhora") as string)
    const preciopordia = Number(formData.get("preciopordia") as string)
    const fotos = formData.get("fotos") as string
    const equipoincluido = formData.get("equipoincluido") as string
    const videos = formData.get("videos") as string
    const planos = formData.get("planos") as string
    const renders = formData.get("renders") as string

    // Paso 2: Validar variables obligatorias
    if (!nombre || nombre.length < 2) {
      return { success: false, error: "El parametro nombre, esta incompleto. Favor de verificar." }
    }
    if (!hotelid || hotelid === -1) {
      return { success: false, error: "El parametro hotelid, esta incompleto. Favor de verificar." }
    }

    const { data: salonExistente, error: errorExistencia } = await supabase
      .from("salones")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      console.error("Error validando existencia del salon:", errorExistencia)
      return { success: false, error: "Error validando existencia del salon: " + errorExistencia.message }
    }

    if (!salonExistente) {
      return { success: false, error: "El salon con el id proporcionado no existe" }
    }

    let fotosParsed = null
    if (fotos && fotos.length > 0) {
      try {
        fotosParsed = JSON.parse(fotos)
      } catch (parseError) {
        return { success: false, error: "El formato de fotos no es JSON válido" }
      }
    }

    let equipoincluidoParsed = null
    if (equipoincluido && equipoincluido.length > 0) {
      try {
        equipoincluidoParsed = JSON.parse(equipoincluido)
      } catch (parseError) {
        return { success: false, error: "El formato de equipoincluido no es JSON válido" }
      }
    }

    let videosParsed = null
    if (videos && videos.length > 0) {
      try {
        videosParsed = JSON.parse(videos)
      } catch (parseError) {
        return { success: false, error: "El formato de videos no es JSON válido" }
      }
    }

    let planosParsed = null
    if (planos && planos.length > 0) {
      try {
        planosParsed = JSON.parse(planos)
      } catch (parseError) {
        return { success: false, error: "El formato de planos no es JSON válido" }
      }
    }

    let rendersParsed = null
    if (renders && renders.length > 0) {
      try {
        rendersParsed = JSON.parse(renders)
      } catch (parseError) {
        return { success: false, error: "El formato de renders no es JSON válido" }
      }
    }

    const updateData: any = {
      hotelid,
      nombre,
      descripcion,
      longitud,
      ancho,
      altura,
      aream2,
      capacidadminima,
      capacidadmaxima,
      precioporhora,
      preciopordia,
      fotos: fotosParsed,
      equipoincluido: equipoincluidoParsed,
      videos: videosParsed,
      planos: planosParsed,
      renders: rendersParsed,
      fechaactualizacion: new Date().toISOString(),
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase.from("salones").update(updateData).eq("id", id).select("id").single()

    // Return error
    if (error) {
      console.error("Error actualizando salon en query en actualizarSalon de actions/salones:", error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del salon actualizado" }
    }

    revalidatePath("/salones")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error: unknown) {
    console.error("Error en actualizarSalon de actions/salones: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarSalon de actions/salones: " + errorMessage,
    }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarSalon / delSalon: Función para eliminar

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoSalon / actSalon: Función especial para cambiar columna activo, el valor debe ser boolean
export async function estatusActivoSalon(id: number, activo: boolean): Promise<{ success: boolean; error: string }> {
  try {
    const { data: salonExistente, error: errorExistencia } = await supabase
      .from("salones")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      console.error("Error validando existencia del salon en estatusActivoSalon:", errorExistencia)
      return { success: false, error: "Error validando existencia del salon: " + errorExistencia.message }
    }

    if (!salonExistente) {
      return { success: false, error: "El salon con el id proporcionado no existe" }
    }

    const { error } = await supabase.from("salones").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error("Error actualizando estatus activo del salon en estatusActivoSalon de app/actions/salones:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/salones")
    return { success: true, error: "" }
  } catch (error: unknown) {
    console.error("Error en estatusActivoSalon de app/actions/salones: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno del servidor: " + errorMessage }
  }
}

// Función: listaDesplegableSalones / ddlSalones: Función que se utiliza para los dropdownlist
export async function listaDesplegableSalones(id = -1, descripcion = "", hotelid = -1) {
  try {
    // Query principal
    let query = supabase.from("salones").select("id, nombre").eq("activo", true)

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.ilike("nombre", `%${descripcion}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }

    query = query.order("nombre", { ascending: true }).limit(100)

    // Varaibles y resultados del query
    const { data: salones, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de salones:", error)
      return { success: false, error: "Error obteniendo lista de salones: " + error.message }
    }

    if (!salones || salones.length === 0) {
      return { success: true, data: [] }
    }

    const data: ddlItem[] = salones.map((salon) => ({
      value: salon.id.toString(),
      text: salon.nombre,
    }))

    return { success: true, data }
  } catch (error: unknown) {
    console.error("Error en listaDesplegableSalones:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo lista desplegable de salones: " + errorMessage }
  }
}
