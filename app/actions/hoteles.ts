"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import type { oHotel } from "@/types/hoteles.types"
import type { ddlItem } from "@/types/common"
import { imagenSubir } from "@/app/actions/utilerias"
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
    - objetoHotel / oHotel (Individual)
    - objetoHoteles / oHoteles (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearHotel / insHotel

  * SELECTS: READ/OBTENER/SELECT
    - obtenerHoteles / selHoteles

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarHotel / updHotel

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarHotel / delHotel

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoHotel / actHotel
    - listaDesplegableHoteles / ddlHoteles
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoHotel / oHotel (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoHotel(
  hotelid = -1,
  acronimo = "",
  nombre = "",
  paisid = -1,
  estadoid = -1,
  ciudadid = -1,
  activoevento = "Todos",
  activocentroconsumo = "Todos",
  activo = "Todos",
): Promise<{ success: boolean; error: string; data: oHotel | null }> {
  try {
    let query = supabase.from("vw_ohoteles").select("*")

    // Agregar filtros condicionales
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (acronimo !== "") {
      query = query.ilike("acronimo", `%${acronimo}%`)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (paisid !== -1) {
      query = query.eq("paisid", paisid)
    }
    if (estadoid !== -1) {
      query = query.eq("estadoid", estadoid)
    }
    if (ciudadid !== -1) {
      query = query.eq("ciudadid", ciudadid)
    }

    if (activoevento !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(activoevento)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(activoevento)

      if (isActive) {
        query = query.eq("activoevento", true)
      } else if (isInactive) {
        query = query.eq("activoevento", false)
      }
    }

    if (activocentroconsumo !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(activocentroconsumo)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(activocentroconsumo)

      if (isActive) {
        query = query.eq("activocentroconsumo", true)
      } else if (isInactive) {
        query = query.eq("activocentroconsumo", false)
      }
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
      console.error("Error en la funcion objetoHotel (Individual) de actions/hoteles : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoHotel de actions/hoteles: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oHotel }
  } catch (error: unknown) {
    console.error("Error en app/actions/hoteles en objetoHotel (Individual): ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoHotel: " + errorMessage, data: null }
  }
}

// Función: objetoHoteles / oHoteles (Listado): Esta Función crea un listado de objetos/clases, es un array
export async function objetoHoteles(
  acronimo = "",
  nombre = "",
  paisid = -1,
  estadoid = -1,
  ciudadid = -1,
  activoevento = "Todos",
  activocentroconsumo = "Todos",
  activo = "Todos",
): Promise<{ success: boolean; error: string; data: oHotel[] | null }> {
  try {
    let query = supabase.from("vw_ohoteles").select("*")

    if (acronimo !== "") {
      query = query.ilike("acronimo", `%${acronimo}%`)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (paisid !== -1) {
      query = query.eq("paisid", paisid)
    }
    if (estadoid !== -1) {
      query = query.eq("estadoid", estadoid)
    }
    if (ciudadid !== -1) {
      query = query.eq("ciudadid", ciudadid)
    }

    if (activoevento !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(activoevento)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(activoevento)

      if (isActive) {
        query = query.eq("activoevento", true)
      } else if (isInactive) {
        query = query.eq("activoevento", false)
      }
    }

    if (activocentroconsumo !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(activocentroconsumo)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(activocentroconsumo)

      if (isActive) {
        query = query.eq("activocentroconsumo", true)
      } else if (isInactive) {
        query = query.eq("activocentroconsumo", false)
      }
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
      console.error("Error en la funcion objetoHoteles (Listado) de actions/hoteles : ", error)
      return {
        success: false,
        error: "Error en la funcion objetoHoteles de actions/hoteles: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oHotel[] }
  } catch (error: unknown) {
    console.error("Error en app/actions/hoteles en objetoHoteles (Listado): ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoHoteles: " + errorMessage, data: null }
  }
}
/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearHotel / insHotel: Función para insertar
// NOTA: funcion incesaria, esto al ser un catalogo muy limitado, se hace mas rapido por SQL en la base de datos
export async function crearHotel(formData: unknown) {}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerHoteles / selHoteles: Función para obtener
export async function obtenerHoteles(
  hotelid = -1,
  acronimo = "",
  nombre = "",
  paisid = -1,
  estadoid = -1,
  ciudadid = -1,
  activoevento = "Todos",
  activocentroconsumo = "Todos",
  activo = "Todos",
): Promise<{ success: boolean; error: string; data: unknown }> {
  try {
    // Query principal
    let query = supabase.from("vw_ohoteles").select("*")

    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (acronimo !== "") {
      query = query.ilike("acronimo", `%${acronimo}%`)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (paisid !== -1) {
      query = query.eq("paisid", paisid)
    }
    if (estadoid !== -1) {
      query = query.eq("estadoid", estadoid)
    }
    if (ciudadid !== -1) {
      query = query.eq("ciudadid", ciudadid)
    }

    if (activoevento !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(activoevento)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(activoevento)

      if (isActive) {
        query = query.eq("activoevento", true)
      } else if (isInactive) {
        query = query.eq("activoevento", false)
      }
    }

    if (activocentroconsumo !== "Todos") {
      const isActive = ["True", "true", "Activo", "1", true].includes(activocentroconsumo)
      const isInactive = ["False", "false", "Inactivo", "0", false].includes(activocentroconsumo)

      if (isActive) {
        query = query.eq("activocentroconsumo", true)
      } else if (isInactive) {
        query = query.eq("activocentroconsumo", false)
      }
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
      console.error("Error en la funcion obtenerHoteles de actions/hoteles: ", error)
      return {
        success: false,
        error: "Error en la funcion obtenerHoteles de actions/hoteles: " + error.message,
        data: null,
      }
    }

    // Regreso de data
    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    console.error("Error en app/actions/hoteles en obtenerHoteles: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerHoteles: " + errorMessage, data: null }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Función: actualizarHotel / updHotel: Función para actualizar
export async function actualizarHotel(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const id = Number(formData.get("id") as string)
    const acronimo = formData.get("acronimo") as string
    const nombre = formData.get("nombre") as string
    const categoria = formData.get("categoria") as string
    const telefono = formData.get("telefono") as string
    const email = formData.get("email") as string
    const website = formData.get("website") as string
    const direccion = formData.get("direccion") as string
    const codigopostal = formData.get("codigopostal") as string
    const estrellas = formData.get("estrellas") as string
    const altitud = formData.get("altitud") as string
    const longitud = formData.get("longitud") as string
    const totalcuartos = Number(formData.get("totalcuartos") as string)
    const activoevento = formData.get("activoevento") as string
    // amenidades debe ser un jsonb
    const amenidades = formData.get("amenidades") as string

    const activocentroconsumo = formData.get("activocentroconsumo") as string
    const imgurl = formData.get("imgurl") as string

    // Paso 2: Validar variables obligatorias
    if (!nombre || nombre.length < 2) {
      return { success: false, error: "El parametro nombre, esta incompleto. Favor de verificar." }
    }
    if (!email || email.length < 3) {
      return { success: false, error: "El parametro email, esta incompleto. Favor de verificar." }
    }

    const { data: hotelExistente, error: errorExistencia } = await supabase
      .from("hoteles")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      console.error("Error validando existencia del hotel:", errorExistencia)
      return { success: false, error: "Error validando existencia del hotel: " + errorExistencia.message }
    }

    if (!hotelExistente) {
      return { success: false, error: "El hotel con el id proporcionado no existe" }
    }

    // Paso 3: Subir imagen para obtener su url
    let imagenurl = ""
    const imagen = formData.get("imagen") as File
    if (imagen && imagen.size > 0) {
      const resultadoImagen = await imagenSubir(imagen, nombre, "hoteles")
      if (!resultadoImagen.success) {
        return { success: false, error: resultadoImagen.error }
      } else {
        imagenurl = resultadoImagen.url || ""
      }
    } else {
      imagenurl = imgurl || ""
    }

    let amenidadesParsed = null
    if (amenidades && amenidades.length > 0) {
      try {
        amenidadesParsed = JSON.parse(amenidades)
      } catch (parseError) {
        return { success: false, error: "El formato de amenidades no es JSON válido" }
      }
    }

    const updateData: any = {
      acronimo,
      nombre,
      categoria,
      telefono,
      email,
      website,
      direccion,
      codigopostal,
      estrellas,
      altitud,
      longitud,
      totalcuartos,
      activoevento: activoevento === "true" || activoevento === "1" || activoevento === "True",
      activocentroconsumo:
        activocentroconsumo === "true" || activocentroconsumo === "1" || activocentroconsumo === "True",
      amenidades: amenidadesParsed,
      imgurl: imagenurl,
    }

    // Paso 5: Ejecutar Query
    const { data, error } = await supabase.from("hoteles").update(updateData).eq("id", id).select("id").single()

    // Return error
    if (error) {
      console.error("Error actualizando hotel en query en actualizarHotel de actions/hoteles:", error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del hotel actualizado" }
    }

    revalidatePath("/hoteles")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error: unknown) {
    console.error("Error en actualizarHotel de actions/hoteles: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarHotel de actions/hoteles: " + errorMessage,
    }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarHotel / delHotel: Función para eliminar

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: estatusActivoHotel / actHotel: Función especial para cambiar columna activo, el valor debe ser boolean
export async function estatusActivoHotel(id: number, activo: boolean): Promise<{ success: boolean; error: string }> {
  try {
    const { data: hotelExistente, error: errorExistencia } = await supabase
      .from("hoteles")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      console.error("Error validando existencia del hotel en estatusActivoHotel:", errorExistencia)
      return { success: false, error: "Error validando existencia del hotel: " + errorExistencia.message }
    }

    if (!hotelExistente) {
      return { success: false, error: "El hotel con el id proporcionado no existe" }
    }

    const { error } = await supabase.from("hoteles").update({ activo: activo }).eq("id", id)

    if (error) {
      console.error("Error actualizando estatus activo del hotel en estatusActivoHotel de app/actions/hoteles:", error)
      return { success: false, error: error.message }
    }

    console.log(`[v0] Hotel ${id} actualizado a activo: ${activo}`)

    revalidatePath("/hoteles")
    return { success: true, error: "" }
  } catch (error: unknown) {
    console.error("Error en estatusActivoHotel de app/actions/hoteles: ", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno del servidor: " + errorMessage }
  }
}

// Función: listaDesplegableHoteles / ddlHoteles: Función que se utiliza para los dropdownlist
export async function listaDesplegableHoteles(id = -1, descripcion = "") {
  try {
    console.log("[v0] listaDesplegableHoteles - Iniciando con params:", { id, descripcion })

    // Query principal
    let query = supabase.from("hoteles").select("id, nombre").eq("activo", true)

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.ilike("nombre", `%${descripcion}%`)
    }

    query = query.order("nombre", { ascending: true }).limit(100)

    console.log("[v0] listaDesplegableHoteles - Ejecutando query...")

    // Varaibles y resultados del query
    const { data: hoteles, error } = await query

    console.log("[v0] listaDesplegableHoteles - Resultados:", {
      hotelCount: hoteles?.length || 0,
      error: error?.message || "ninguno",
      hoteles: hoteles,
    })

    if (error) {
      console.error("Error obteniendo la lista desplegable de hoteles:", error)
      return { success: false, error: "Error obteniendo lista de hoteles: " + error.message }
    }

    if (!hoteles || hoteles.length === 0) {
      console.log("[v0] listaDesplegableHoteles - No se encontraron hoteles activos")
      return { success: true, data: [] }
    }

    const data: ddlItem[] = hoteles.map((hotel) => ({
      value: hotel.id.toString(),
      text: hotel.nombre,
    }))

    console.log("[v0] listaDesplegableHoteles - Data final:", data)

    return { success: true, data }
  } catch (error: unknown) {
    console.error("Error en listaDesplegableHoteles:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo lista desplegable de hoteles: " + errorMessage }
  }
}
