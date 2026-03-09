"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
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
    - objetoReservacion / oReservacion (Individual)
    - objetoReservaciones / oReservaciones (Listado / Array)

  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearReservacion / insReservacion

  * SELECTS: READ/OBTENER/SELECT
    - obtenerReservaciones / selReservaciones

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarReservacion / updReservacion

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarReservacion / delReservacion

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoReservacion / actReservacion
    - listaDesplegableReservaciones / ddlReservaciones
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoReservacion / oReservacion (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoReservacion(
  id = -1,
  nombreevento = "",
  hotelid = -1,
  clienteid = -1,
  activo = "Todos",
  fecharangoinicio = "1900-01-01",
  fecharangofin = "2100-01-01",
): Promise<{ success: boolean; error: string; data: any | null }> {
  try {
    let query = supabase.from("vw_oreservaciones").select("*")

    // Agregar filtros condicionales
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombreevento !== "") {
      query = query.ilike("nombreevento", `%${nombreevento}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (clienteid !== -1) {
      query = query.eq("clienteid", clienteid)
    }
    if (fecharangoinicio !== "1900-01-01") {
      query = query.eq("fechainicio", fecharangoinicio)
    }
    if (fecharangofin !== "2100-01-01") {
      query = query.eq("fechafin", fecharangofin)
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
      return {
        success: false,
        error: "Error en la funcion objetoReservacion de actions/reservaciones: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoReservacion: " + errorMessage, data: null }
  }
}

// Función: objetoReservaciones / oReservaciones (Listado): Esta Función crea un listado de objetos/clases, es un array
export async function objetoReservaciones(
  nombreevento = "",
  hotelid = -1,
  clienteid = -1,
  activo = "Todos",
  fecharangoinicio = "1900-01-01",
  fecharangofin = "2100-01-01",
): Promise<{ success: boolean; error: string; data: any[] | null }> {
  try {
    let query = supabase.from("vw_oreservaciones").select("*")

    if (nombreevento !== "") {
      query = query.ilike("nombreevento", `%${nombreevento}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (clienteid !== -1) {
      query = query.eq("clienteid", clienteid)
    }
    if (fecharangoinicio !== "1900-01-01") {
      query = query.eq("fechainicio", fecharangoinicio)
    }
    if (fecharangofin !== "2100-01-01") {
      query = query.eq("fechafin", fecharangofin)
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
      return {
        success: false,
        error: "Error en la funcion objetoReservaciones de actions/reservaciones: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoReservaciones: " + errorMessage, data: null }
  }
}
/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearReservacion / insReservacion: Función para insertar
export async function crearReservacion(formData: unknown) {}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerReservaciones / selReservaciones: Función para obtener
export async function obtenerReservaciones(
  id = -1,
  nombreevento = "",
  hotelid = -1,
  clienteid = -1,
  activo = "Todos",
  fecharangoinicio = "1900-01-01",
  fecharangofin = "2100-01-01",
): Promise<{ success: boolean; error: string; data: unknown }> {
  try {
    // Query principal
    let query = supabase.from("vw_oreservaciones").select("*")

    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombreevento !== "") {
      query = query.ilike("nombreevento", `%${nombreevento}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (clienteid !== -1) {
      query = query.eq("clienteid", clienteid)
    }
    if (fecharangoinicio !== "1900-01-01") {
      query = query.eq("fechainicio", fecharangoinicio)
    }
    if (fecharangofin !== "2100-01-01") {
      query = query.eq("fechafin", fecharangofin)
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
        error: "Error en la funcion obtenerReservaciones de actions/reservaciones: " + error.message,
        data: null,
      }
    }

    // Regreso de data
    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerReservaciones: " + errorMessage, data: null }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Función: actualizarReservacion / updReservacion: Función para actualizar
export async function actualizarReservacion(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const id = Number(formData.get("id") as string)
    const nombreevento = formData.get("nombreevento") as string
    const hotelid = Number(formData.get("hotelid") as string)
    const clienteid = Number(formData.get("clienteid") as string)
    const fechaconfirmacion = formData.get("fechaconfirmacion") as string
    const fechacancelacion = formData.get("fechacancelacion") as string
    const motivocancelacion = formData.get("motivocancelacion") as string
    const fechainicio = formData.get("fechainicio") as string
    const fechafin = formData.get("fechafin") as string
    const totalmonto = Number(formData.get("totalmonto") as string)
    const salonid = formData.get("salonid") as string
    const montajeid = formData.get("montajeid") as string
    const horainicio = formData.get("horainicio") as string
    const horafin = formData.get("horafin") as string
    const numeroinvitados = formData.get("numeroinvitados") as string
    const estatus = formData.get("estatus") as string
    const estatusdepago = formData.get("estatusdepago") as string
    const subtotal = formData.get("subtotal") as string
    const fechaactualizacion = formData.get("fechaactualizacion") as string
    const adultos = formData.get("adultos") as string
    const menores = formData.get("menores") as string
    const noches = formData.get("noches") as string
    const montopagado = formData.get("montopagado") as string
    const impuestos = formData.get("impuestos") as string
    const notas = formData.get("notas") as string

    // Paso 2: Validar variables obligatorias
    if (!nombreevento || nombreevento.length < 2) {
      return { success: false, error: "El parametro nombreevento, esta incompleto. Favor de verificar." }
    }

    const { data: reservacionExistente, error: errorExistencia } = await supabase
      .from("reservaciones")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      return { success: false, error: "Error validando existencia de la reservacion: " + errorExistencia.message }
    }

    if (!reservacionExistente) {
      return { success: false, error: "La reservacion con el id proporcionado no existe" }
    }

    const updateData: any = {
      nombreevento,
      hotelid,
      clienteid,
      fechaconfirmacion,
      fechacancelacion,
      motivocancelacion,
      fechainicio,
      fechafin,
      totalmonto,
      salonid,
      montajeid,
      horainicio,
      horafin,
      numeroinvitados,
      estatus,
      estatusdepago,
      subtotal,
      fechaactualizacion,
      adultos,
      menores,
      noches,
      montopagado,
      impuestos,
      notas
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase.from("reservaciones").update(updateData).eq("id", id).select("id").single()

    // Return error
    if (error) {
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID de la reservacion actualizada" }
    }

    revalidatePath("/reservaciones")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarReservacion de actions/reservaciones: " + errorMessage,
    }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarReservacion / delReservacion: Función para eliminar

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoReservacion / actReservacion: Función especial para cambiar columna activo, el valor debe ser boolean
export async function estatusActivoReservacion(
  id: number,
  activo: boolean,
): Promise<{ success: boolean; error: string }> {
  try {
    const { data: reservacionExistente, error: errorExistencia } = await supabase
      .from("reservaciones")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      return { success: false, error: "Error validando existencia de la reservacion: " + errorExistencia.message }
    }

    if (!reservacionExistente) {
      return { success: false, error: "La reservacion con el id proporcionado no existe" }
    }

    const { error } = await supabase.from("reservaciones").update({ activo: activo }).eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/reservaciones")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno del servidor: " + errorMessage }
  }
}

// Función: obtenerDisponibilidadSalon: Obtiene las reservaciones activas de un salón para validar disponibilidad
export async function obtenerDisponibilidadSalon(
  salonId: number,
): Promise<{ success: boolean; error: string; data: any[] | null }> {
  try {
    const { data, error } = await supabase
      .from("vw_oreservaciones")
      .select("*")
      .eq("salonid", salonId)
      .eq("activo", true)

    if (error) {
      return { success: false, error: "Error en obtenerDisponibilidadSalon: " + error.message, data: null }
    }

    return { success: true, error: "", data: data ?? [] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerDisponibilidadSalon: " + errorMessage, data: null }
  }
}

// Función: obtenerReservacionesPorDia: Obtiene las reservaciones de un salón en una fecha específica
export async function obtenerReservacionesPorDia(
  fecha: string,
  salonId: number,
): Promise<{ success: boolean; error: string; data: any[] | null }> {
  try {
    const { data, error } = await supabase
      .from("vw_oreservaciones")
      .select("*")
      .eq("salonid", salonId)
      .eq("activo", true)
      .lte("fechainicio", fecha)
      .gte("fechafin", fecha)

    if (error) {
      return { success: false, error: "Error en obtenerReservacionesPorDia: " + error.message, data: null }
    }

    return { success: true, error: "", data: data ?? [] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerReservacionesPorDia: " + errorMessage, data: null }
  }
}

// Función: listaDesplegableReservaciones / ddlReservaciones: Función que se utiliza para los dropdownlist
export async function listaDesplegableReservaciones(id = -1, nombreevento = "") {
  try {
    // Query principal
    let query = supabase.from("reservaciones").select("id, nombreevento").eq("activo", true)

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombreevento !== "") {
      query = query.ilike("nombreevento", `%${nombreevento}%`)
    }

    query = query.order("nombreevento", { ascending: true }).limit(100)

    // Varaibles y resultados del query
    const { data: reservaciones, error } = await query

    if (error) {
      return { success: false, error: "Error obteniendo lista de reservaciones: " + error.message }
    }

    if (!reservaciones || reservaciones.length === 0) {
      return { success: true, data: [] }
    }

    const data: ddlItem[] = reservaciones.map((reservacion) => ({
      value: reservacion.id.toString(),
      text: reservacion.nombreevento,
    }))

    return { success: true, data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo lista desplegable de reservaciones: " + errorMessage }
  }
}
