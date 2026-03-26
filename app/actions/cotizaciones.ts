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
    - objetoCotizacion / oCotizacion (Individual)
    - objetoCotizaciones / oCotizaciones (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearCotizacion / insCotizacion

  * SELECTS: READ/OBTENER/SELECT
    - obtenerCotizaciones / selCotizaciones

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarCotizacion / updCotizacion

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarCotizacion / delCotizacion

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoCotizacion / actCotizacion
    - listaDesplegableCotizaciones / ddlCotizaciones
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoCotizacion / oCotizacion (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoCotizacion(
  id = -1,
  nombreevento = "",
  hotelid = -1,
  clienteid = -1,
  activo = "Todos",
  fecharangoinicio = "1900-01-01",
  fecharangofin = "2100-01-01",
): Promise<{ success: boolean; error: string; data: any | null }> {
  try {
    let query = supabase.from("vw_ocotizaciones").select("*")

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

    const { data, error } = await query.limit(1)

    if (error) {
      console.error("Error en la funcion objetoCotizacion (Individual) de actions/cotizaciones : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoCotizacion de actions/cotizaciones: " + error.message,
        data: null,
      }
    }

    const row = data?.[0] ?? null

    // Complementar con campos no incluidos en la vista
    if (row?.id) {
      const { data: extra } = await supabase
        .from("cotizaciones")
        .select("categoriaevento, estatusid")
        .eq("id", row.id)
        .single()
      if (extra) {
        row.categoriaevento = extra.categoriaevento
        row.estatusid = extra.estatusid
      }
    }

    return { success: true, error: "", data: row }
  } catch (error: unknown) {
    console.error("Error en app/actions/cotizaciones en objetoCotizacion (Individual): ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoCotizacion: " + errorMessage, data: null }
  }
}

// Función: objetoCotizaciones / oCotizaciones (Listado): Esta Función crea un listado de objetos/clases, es un array
export async function objetoCotizaciones(
  id = -1,
  nombreevento = "",
  hotelid = -1,
  clienteid = -1,
  activo = "Todos",
  fecharangoinicio = "1900-01-01",
  fecharangofin = "2100-01-01",
): Promise<{ success: boolean; error: string; data: any[] | null }> {
  try {
    let query = supabase.from("vw_ocotizaciones").select("*")

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
      console.error("Error en la funcion objetoCotizaciones (Listado) de actions/cotizaciones : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoCotizaciones de actions/cotizaciones: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    console.error("Error en app/actions/cotizaciones en objetoCotizaciones (Listado): ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoCotizaciones: " + errorMessage, data: null }
  }
}
// Función: obtenerCotizacionesPorHotel: Obtiene cotizaciones de un hotel en un rango de fechas
// Función: obtenerEventosPorHotel: obtiene eventos (cotizaciones y reservaciones) desde vw_oeventos
export async function obtenerEventosPorHotel(
  hotelId: number,
  fechaInicio: string,
  fechaFin: string,
): Promise<{ success: boolean; error: string; data: any[] | null }> {
  try {
    const { data, error } = await supabase
      .from("vw_oeventos")
      .select("id, nombreevento, salon, salonid, fechainicio, fechafin, horainicio, horafin, estatus, cliente, numeroinvitados, tiporegistro")
      .eq("hotelid", hotelId)
      .lte("fechainicio", fechaFin)
      .gte("fechafin", fechaInicio)

    if (error) {
      return { success: false, error: "Error en obtenerEventosPorHotel: " + error.message, data: null }
    }

    return { success: true, error: "", data: data ?? [] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerEventosPorHotel: " + errorMessage, data: null }
  }
}

export async function obtenerCotizacionesPorHotel(
  hotelId: number,
  fechaInicio: string,
  fechaFin: string,
): Promise<{ success: boolean; error: string; data: any[] | null }> {
  try {
    const { data, error } = await supabase
      .from("vw_ocotizaciones")
      .select("id, nombreevento, salonid, fechainicio, fechafin, horainicio, horafin, estatus, cliente, numeroinvitados")
      .eq("hotelid", hotelId)
      .lte("fechainicio", fechaFin)
      .gte("fechafin", fechaInicio)

    if (error) {
      return { success: false, error: "Error en obtenerCotizacionesPorHotel: " + error.message, data: null }
    }

    return { success: true, error: "", data: data ?? [] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerCotizacionesPorHotel: " + errorMessage, data: null }
  }
}

/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearCotizacion / insCotizacion: Función para insertar en tabla eventos
export async function crearCotizacion(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const nombreevento = formData.get("nombreevento") as string
    const tipoevento = formData.get("tipoevento") as string
    const hotelid = Number(formData.get("hotelid") as string)
    const clienteid = Number(formData.get("clienteid") as string)
    const fechainicio = formData.get("fechainicio") as string
    const fechafin = formData.get("fechafin") as string
    const totalmonto = Number(formData.get("totalmonto") as string)
    const salonid = formData.get("salonid") as string
    const montajeid = formData.get("montajeid") as string
    const horainicio = formData.get("horainicio") as string
    const horafin = formData.get("horafin") as string
    const numeroinvitados = formData.get("numeroinvitados") as string
    const adultos = formData.get("adultos") as string
    const ninos = formData.get("ninos") as string
    const estatusid = formData.get("estatusid") as string
    const categoriaevento = formData.get("categoriaevento") as string
    const subtotal = formData.get("subtotal") as string
    const impuestos = formData.get("impuestos") as string
    const porcentajedescuento = formData.get("porcentajedescuento") as string
    const montodescuento = formData.get("montodescuento") as string

    // Paso 2: Validar variables obligatorias
    if (!nombreevento || nombreevento.length < 2) {
      return { success: false, error: "El parametro nombre, esta incompleto. Favor de verificar." }
    }

    // Paso 2.1: Obtener acrónimo del hotel
    const { data: hotelData, error: hotelError } = await supabase
      .from("hoteles")
      .select("acronimo")
      .eq("id", hotelid)
      .single()

    if (hotelError || !hotelData) {
      console.error("Error obteniendo acrónimo del hotel:", hotelError)
      return { success: false, error: "No se pudo obtener el acrónimo del hotel" }
    }

    const acronimo = hotelData.acronimo

    // Paso 2.2: Buscar todos los folios con el patrón de este hotel
    const folioPattern = `${acronimo}-E-%`
    const { data: existingFolios, error: folioError } = await supabase
      .from("eventos")
      .select("folio")
      .like("folio", folioPattern)
      .order("folio", { ascending: false })

    if (folioError) {
      console.error("Error buscando folios existentes:", folioError)
      return { success: false, error: "Error al buscar folios existentes" }
    }

    // Paso 2.3: Calcular el siguiente consecutivo
    let consecutivo = 1
    if (existingFolios && existingFolios.length > 0) {
      // Extraer todos los números de los folios y tomar el máximo
      const numeros = existingFolios
        .map((f) => {
          const match = f.folio.match(/E-(\d+)$/)
          return match ? Number.parseInt(match[1]) : 0
        })
        .filter((n) => n > 0)

      if (numeros.length > 0) {
        consecutivo = Math.max(...numeros) + 1
      }
    }

    // Paso 2.4: Crear el folio con formato: ACRONIMO + "E" + consecutivo
    const folio = `${acronimo}-E-${consecutivo}`

    // Paso 3: Preparar datos para inserción
    const insertData: any = {
      folio,
      nombreevento,
      tipoevento,
      hotelid,
      clienteid,
      fechainicio,
      fechafin,
      totalmonto: totalmonto || null,
      salonid: salonid || null,
      montajeid: montajeid || null,
      horainicio: horainicio || null,
      horafin: horafin || null,
      numeroinvitados: numeroinvitados || null,
      adultos: adultos ? Number(adultos) : null,
      ninos: ninos ? Number(ninos) : null,
      estatusid: estatusid ? Number(estatusid) : null,
      categoriaevento: categoriaevento || null,
      subtotal: subtotal ? Number(subtotal) : null,
      impuestos: impuestos ? Number(impuestos) : null,
      porcentajedescuento: porcentajedescuento ? Number(porcentajedescuento) : null,
      montodescuento: montodescuento ? Number(montodescuento) : null,
      activo: true,
      tiporegistro: "Cotizacion",
    }

    // Paso 4: Ejecutar Query de INSERT en tabla eventos
    const { data, error } = await supabase.from("eventos").insert(insertData).select("id").single()

    // Return error
    if (error) {
      console.error("Error insertando evento en query en crearCotizacion de actions/cotizaciones:", error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del evento creado" }
    }

    revalidatePath("/cotizaciones")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error: unknown) {
    console.error("Error en crearCotizacion de actions/cotizaciones: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar crearCotizacion de actions/cotizaciones: " + errorMessage,
    }
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerCotizaciones / selCotizaciones: Función para obtener
export async function obtenerCotizaciones(
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
    let query = supabase.from("vw_ocotizaciones").select("*")

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
      console.error("Error en la funcion obtenerCotizaciones de actions/cotizaciones: ", error)
      return {
        success: false,
        error: "Error en la funcion obtenerCotizaciones de actions/cotizaciones: " + error.message,
        data: null,
      }
    }

    // Regreso de data
    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    console.error("Error en app/actions/cotizaciones en obtenerCotizaciones: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerCotizaciones: " + errorMessage, data: null }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Función: actualizarCotizacion / updCotizacion: Función para actualizar
export async function actualizarCotizacion(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const id = Number(formData.get("id") as string)
    const nombreevento = formData.get("nombreevento") as string
    const tipoevento = formData.get("tipoevento") as string
    const hotelid = Number(formData.get("hotelid") as string)
    const clienteid = Number(formData.get("clienteid") as string)
    const fechainicio = formData.get("fechainicio") as string
    const fechafin = formData.get("fechafin") as string
    const totalmonto = Number(formData.get("totalmonto") as string)
    const salonid = formData.get("salonid") as string
    const montajeid = formData.get("montajeid") as string
    const horainicio = formData.get("horainicio") as string
    const horafin = formData.get("horafin") as string
    const numeroinvitados = formData.get("numeroinvitados") as string
    const estatusid = formData.get("estatusid") as string
    const categoriaevento = formData.get("categoriaevento") as string
    const subtotal = formData.get("subtotal") as string
    const impuestos = formData.get("impuestos") as string
    const porcentajedescuento = formData.get("porcentajedescuento") as string
    const montodescuento = formData.get("montodescuento") as string
    const fechaactualizacion = formData.get("fechaactualizacion") as string

    // Paso 2: Validar variables obligatorias
    if (!nombreevento || nombreevento.length < 2) {
      return { success: false, error: "El parametro nombre, esta incompleto. Favor de verificar." }
    }

    const { data: cotizacionExistente, error: errorExistencia } = await supabase
      .from("cotizaciones")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      console.error("Error validando existencia de la cotizacion:", errorExistencia)
      return { success: false, error: "Error validando existencia de la cotizacion: " + errorExistencia.message }
    }

    if (!cotizacionExistente) {
      return { success: false, error: "La cotizacion con el id proporcionado no existe" }
    }

    const updateData: any = {
      nombreevento,
      tipoevento,
      hotelid,
      clienteid,
      fechainicio,
      fechafin,
      totalmonto,
      salonid,
      montajeid,
      horainicio,
      horafin,
      numeroinvitados,
      estatusid: estatusid ? Number(estatusid) : null,
      categoriaevento: categoriaevento || null,
      subtotal: subtotal ? Number(subtotal) : null,
      impuestos: impuestos ? Number(impuestos) : null,
      porcentajedescuento: porcentajedescuento ? Number(porcentajedescuento) : null,
      montodescuento: montodescuento ? Number(montodescuento) : null,
      fechaactualizacion,
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase.from("cotizaciones").update(updateData).eq("id", id).select("id").single()

    // Return error
    if (error) {
      console.error("Error actualizando cotizacion en query en actualizarCotizacion de actions/cotizaciones:", error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID de la cotizacion actualizada" }
    }

    revalidatePath("/cotizaciones")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error: unknown) {
    console.error("Error en actualizarCotizacion de actions/cotizaciones: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarCotizacion de actions/cotizaciones: " + errorMessage,
    }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarCotizacion / delCotizacion: Función para eliminar

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoCotizacion / actCotizacion: Función especial para cambiar columna activo, el valor debe ser boolean
export async function estatusActivoCotizacion(
  id: number,
  activo: boolean,
): Promise<{ success: boolean; error: string }> {
  try {
    const { data: cotizacionExistente, error: errorExistencia } = await supabase
      .from("cotizaciones")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      console.error("Error validando existencia de la cotizacion en estatusActivoCotizacion:", errorExistencia)
      return { success: false, error: "Error validando existencia de la cotizacion: " + errorExistencia.message }
    }

    if (!cotizacionExistente) {
      return { success: false, error: "La cotizacion con el id proporcionado no existe" }
    }

    const { error } = await supabase.from("cotizaciones").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error(
        "Error actualizando estatus activo de la cotizacion en estatusActivoCotizacion de app/actions/cotizaciones:",
        error,
      )
      return { success: false, error: error.message }
    }

    revalidatePath("/cotizaciones")
    return { success: true, error: "" }
  } catch (error: unknown) {
    console.error("Error en estatusActivoCotizacion de app/actions/cotizaciones: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno del servidor: " + errorMessage }
  }
}

// Función: listaCategoriaEvento: obtiene categorías de evento desde la tabla categoriaeventos
export async function listaCategoriaEvento() {
  try {
    const { data, error } = await supabase
      .from("categoriaeventos")
      .select("id, nombre")
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo categorías de evento:", error)
      return { success: false, error: error.message }
    }

    const categorias = (data || []).map((r: any) => ({ id: r.id, nombre: r.nombre }))
    return { success: true, data: categorias }
  } catch (error) {
    console.error("Error en listaCategoriaEvento:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableCotizaciones / ddlCotizaciones: Función que se utiliza para los dropdownlist
export async function listaDesplegableCotizaciones(id = -1, nombreevento = "") {
  try {
    // Query principal
    let query = supabase.from("cotizaciones").select("id, nombreevento").eq("activo", true)

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombreevento !== "") {
      query = query.ilike("nombreevento", `%${nombreevento}%`)
    }

    query = query.order("nombreevento", { ascending: true }).limit(100)

    // Varaibles y resultados del query
    const { data: cotizaciones, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de cotizaciones:", error)
      return { success: false, error: "Error obteniendo lista de cotizaciones: " + error.message }
    }

    if (!cotizaciones || cotizaciones.length === 0) {
      return { success: true, data: [] }
    }

    const data: ddlItem[] = cotizaciones.map((cotizacion) => ({
      value: cotizacion.id.toString(),
      text: cotizacion.nombreevento,
    }))

    return { success: true, data }
  } catch (error: unknown) {
    console.error("Error en listaDesplegableCotizaciones:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo lista desplegable de cotizaciones: " + errorMessage }
  }
}
