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
    let query = supabase.from("vw_ocalendarios").select("*")

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
      query = query.eq("tipo", tipo)
    }
    if (fecharangoinicio !== "1900-01-01") {
      query = query.eq("fechainicio", fecharangoinicio)
    }
    if (fecharangofin !== "2100-01-01") {
      query = query.eq("fechafin", fecharangofin)
    }



    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error("Error en la funcion objetoCalendario (Individual) de actions/calendario : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoCalendario de actions/calendario: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    console.error("Error en app/actions/calendario en objetoCalendario (Individual): ", error)
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
    let query = supabase.from("vw_ocalendarios").select("*")

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
      query = query.eq("tipo", tipo)
    }
    if (fecharangoinicio !== "1900-01-01") {
      query = query.eq("fechainicio", fecharangoinicio)
    }
    if (fecharangofin !== "2100-01-01") {
      query = query.eq("fechafin", fecharangofin)
    }

  
    const { data, error } = await query

    if (error) {
      console.error("Error en la funcion objetoCalendarios (Listado) de actions/calendario : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoCalendarios de actions/calendario: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    console.error("Error en app/actions/calendario en objetoCalendarios (Listado): ", error)
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
// Función: obtenerCalendarios / selCalendarios: Función para obtener
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
    let query = supabase.from("vw_ocalendarios").select("*")

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
      query = query.eq("tipo", tipo)
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
      console.error("Error en la funcion obtenerCalendarios de actions/calendario: ", error)
      return {
        success: false,
        error: "Error en la funcion obtenerCalendarios de actions/calendario: " + error.message,
        data: null,
      }
    }

    // Regreso de data
    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    console.error("Error en app/actions/calendario en obtenerCalendarios: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerCalendarios: " + errorMessage, data: null }
  }
}


/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarCalendario / delCalendario: Función para eliminar
