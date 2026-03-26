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
    - objetoCalendario / oCalendario (Individual)
    - objetoCalendarios / oCalendarios (Listado / Array)

  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearCalendario / insCalendario

  * SELECTS: READ/OBTENER/SELECT
    - obtenerCalendarios / selCalendarios
    - obtenerCalendariosPorRango / selCalendariosPorRango (NUEVO - Fase 3)

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarCalendario / updCalendario

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarCalendario / delCalendario

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoCalendario / actCalendario
    - listaDesplegableCalendarios / ddlCalendarios
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoCalendario / oCalendario (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoCalendario(
  id = -1,
  nombreevento = "",
  hotelid = -1,
  salonid = -1,
  estatus = "",
  tipo = "",
  fecharangoinicio = "1900-01-01",
  fecharangofin = "2100-01-01",
): Promise<{ success: boolean; error: string; data: any | null }> {
  try {
    let query = supabase.from("vw_oeventos").select("*")

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
    if (salonid !== -1) {
      query = query.eq("salonid", salonid)
    }
    if (estatus !== "") {
      query = query.eq("estatus", estatus)
    }
    if (tipo !== "") {
      query = query.eq("tiporegistro", tipo)
    }
    if (fecharangoinicio !== "1900-01-01") {
      query = query.eq("fechainicio", fecharangoinicio)
    }
    if (fecharangofin !== "2100-01-01") {
      query = query.eq("fechafin", fecharangofin)
    }



    const { data, error } = await query.maybeSingle()

    if (error) {
      return {
        success: false,
        error: "Error en la funcion objetoCalendario de actions/calendario: " + error.message,
        data: null,
      }
    }

    const mapped = data ? { ...data, tipo: data.tiporegistro === "Reservacion" ? "Reservacion" : "Cotizacion" } : data
    return { success: true, error: "", data: mapped }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoCalendario: " + errorMessage, data: null }
  }
}

// Función: objetoCalendarios / oCalendarios (Listado): Esta Función crea un listado de objetos/clases, es un array
export async function objetoCalendarios(
  nombreevento = "",
  hotelid = -1,
  salonid = -1,
  estatus = "",
  tipo = "",
  fecharangoinicio = "1900-01-01",
  fecharangofin = "2100-01-01",
): Promise<{ success: boolean; error: string; data: any[] | null }> {
  try {
    let query = supabase.from("vw_oeventos").select("*")

    if (nombreevento !== "") {
      query = query.ilike("nombreevento", `%${nombreevento}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (salonid !== -1) {
      query = query.eq("salonid", salonid)
    }
    if (estatus !== "") {
      query = query.eq("estatus", estatus)
    }
    if (tipo !== "") {
      query = query.eq("tiporegistro", tipo)
    }
    if (fecharangoinicio !== "1900-01-01") {
      query = query.eq("fechainicio", fecharangoinicio)
    }
    if (fecharangofin !== "2100-01-01") {
      query = query.eq("fechafin", fecharangofin)
    }


    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en la funcion objetoCalendarios de actions/calendario: " + error.message,
        data: null,
      }
    }

    const mapped = (data || []).map((e: any) => ({ ...e, tipo: e.tiporegistro === "Reservacion" ? "Reservacion" : "Cotizacion" }))
    return { success: true, error: "", data: mapped }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoCalendarios: " + errorMessage, data: null }
  }
}
/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearCalendario / insCalendario: Función para insertar
export async function crearCalendario(formData: unknown) {}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerCalendarios / selCalendarios: Función para obtener (LEGACY - mantener compatibilidad)
export async function obtenerCalendarios(
  id = -1,
  nombreevento = "",
  hotelid = -1,
  salonid = -1,
  estatus = "",
  tipo = "",
  fecharangoinicio = "1900-01-01",
  fecharangofin = "2100-01-01",
): Promise<{ success: boolean; error: string; data: unknown }> {
  try {
    // Query principal
    let query = supabase.from("vw_oeventos").select("*")

    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombreevento !== "") {
      query = query.ilike("nombreevento", `%${nombreevento}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (salonid !== -1) {
      query = query.eq("salonid", salonid)
    }
    if (estatus !== "") {
      query = query.eq("estatus", estatus)
    }
    if (tipo !== "") {
      query = query.eq("tiporegistro", tipo)
    }
    if (fecharangoinicio !== "1900-01-01") {
      query = query.eq("fechainicio", fecharangoinicio)
    }
    if (fecharangofin !== "2100-01-01") {
      query = query.eq("fechafin", fecharangofin)
    }



    // Ejecutar query
    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en la funcion obtenerCalendarios de actions/calendario: " + error.message,
        data: null,
      }
    }

    // Regreso de data con mapeo de tiporegistro a tipo
    const mapped = (data || []).map((e: any) => ({ ...e, tipo: e.tiporegistro === "Reservacion" ? "Reservacion" : "Cotizacion" }))
    return { success: true, error: "", data: mapped }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerCalendarios: " + errorMessage, data: null }
  }
}

// Función: obtenerCalendariosPorRango / selCalendariosPorRango
// FASE 3: Calendario Multipropiedad — consulta optimizada por rango de fechas
// IMPORTANTE: Usa gte/lte en lugar de eq para filtrar por rango de fechas (fix de performance critico)
// Un evento aparece en el rango si: fechainicio <= rangoFin AND fechafin >= rangoInicio (overlap)
export async function obtenerCalendariosPorRango(
  rangoInicio: string,
  rangoFin: string,
  hotelid = -1,
  salonid = -1,
): Promise<{ success: boolean; error: string; data: unknown }> {
  try {
    // Query principal — obtener eventos desde vw_oeventos
    let query = supabase.from("vw_oeventos").select("*")

    // Filtro de rango: evento.fechainicio <= rangoFin AND evento.fechafin >= rangoInicio
    query = query.lte("fechainicio", rangoFin)
    query = query.gte("fechafin", rangoInicio)

    // Filtros opcionales de hotel y salon
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (salonid !== -1) {
      query = query.eq("salonid", salonid)
    }

    // Ordenar por fecha de inicio
    query = query.order("fechainicio", { ascending: true })

    // Ejecutar query
    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en la funcion obtenerCalendariosPorRango de actions/calendario: " + error.message,
        data: null,
      }
    }

    // Mapear tiporegistro a tipo para compatibilidad con el frontend
    const mapped = (data || []).map((e: any) => ({
      ...e,
      tipo: e.tiporegistro === "Reservacion" ? "Reservacion" : "Cotizacion",
    }))

    return { success: true, error: "", data: mapped }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerCalendariosPorRango: " + errorMessage, data: null }
  }
}

// Función: obtenerEventosPorDia / selEventosPorDia
// FASE 3: Obtiene todos los eventos para un dia especifico (para el Day Detail Panel)
export async function obtenerEventosPorDia(
  fecha: string,
  hotelid = -1,
  salonid = -1,
): Promise<{ success: boolean; error: string; data: unknown }> {
  try {
    let query = supabase.from("vw_oeventos").select("*")

    // Un evento esta activo en esta fecha si: fechainicio <= fecha AND fechafin >= fecha
    query = query.lte("fechainicio", fecha)
    query = query.gte("fechafin", fecha)

    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (salonid !== -1) {
      query = query.eq("salonid", salonid)
    }

    query = query.order("hotel", { ascending: true }).order("salon", { ascending: true })

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en la funcion obtenerEventosPorDia de actions/calendario: " + error.message,
        data: null,
      }
    }

    // Mapear tiporegistro a tipo para compatibilidad con el frontend
    const mapped = (data || []).map((e: any) => ({
      ...e,
      tipo: e.tiporegistro === "Reservacion" ? "Reservacion" : "Cotizacion",
    }))

    return { success: true, error: "", data: mapped }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerEventosPorDia: " + errorMessage, data: null }
  }
}


/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarCalendario / delCalendario: Función para eliminar
