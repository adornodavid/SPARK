"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import type { ddlItem } from "@/types/common.types"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey) // Declare the supabase variable

/* ==================================================
  Funciones
  --------------------
	* LIST
    - listaDesplegableCatalogos / ddlCatalogos
================================================== */
// Función: listaDesplegableTipoEvento: obtiene id y nombre de la tabla tipoevento
export async function listaDesplegableTipoEvento() {
  try {
    const { data: resultados, error } = await supabase
      .from("tipoevento")
      .select("id, nombre")
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo tipos de evento: ", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = resultados
      ? resultados.map((r) => ({ value: r.id.toString(), text: r.nombre }))
      : []

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableTipoEvento: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegablePaquetes: obtiene paquetes de vw_paquetes filtrado por tipoeventoid
export async function listaDesplegablePaquetes(tipoeventoid: number) {
  try {
    const { data: resultados, error } = await supabase
      .from("vw_paquetes")
      .select("*")
      .eq("tipoeventoid", tipoeventoid)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo paquetes: ", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: resultados || [] }
  } catch (error) {
    console.error("Error en listaDesplegablePaquetes: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerElementosPaquete: obtiene elementos de vw_elementopaquete filtrado por paqueteid
export async function obtenerElementosPaquete(paqueteid: number) {
  try {
    const { data: resultados, error } = await supabase
      .from("vw_elementopaquete")
      .select("*")
      .eq("paqueteid", paqueteid)

    if (error) {
      console.error("Error obteniendo elementos del paquete: ", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: resultados || [] }
  } catch (error) {
    console.error("Error en obtenerElementosPaquete: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerElementosCotizacion: obtiene elementos de vw_elementocotizacion filtrado por cotizacionid
export async function obtenerElementosCotizacion(cotizacionid: number) {
  try {
    const { data: resultados, error } = await supabase
      .from("vw_elementocotizacion")
      .select("*")
      .eq("cotizacionid", cotizacionid)

    if (error) {
      console.error("Error obteniendo elementos de cotización: ", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: resultados || [] }
  } catch (error) {
    console.error("Error en obtenerElementosCotizacion: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: eliminarElementoCotizacion: elimina un elemento de elementosxcotizacion por cotizacionid, tipoelemento y id del registro
export async function eliminarElementoCotizacion(cotizacionid: number, tipoelemento: string, id: number) {
  try {
    const { error } = await supabase
      .from("elementosxcotizacion")
      .delete()
      .eq("cotizacionid", cotizacionid)
      .eq("tipoelemento", tipoelemento)
      .eq("elementoid", id)

    if (error) {
      console.error("Error eliminando elemento de cotización: ", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error en eliminarElementoCotizacion: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: limpiarElementosCotizacion: elimina TODOS los elementos de elementosxcotizacion para una cotización
export async function limpiarElementosCotizacion(cotizacionid: number) {
  try {
    const { error } = await supabase
      .from("elementosxcotizacion")
      .delete()
      .eq("cotizacionid", cotizacionid)

    if (error) {
      console.error("Error limpiando elementos de cotización: ", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error en limpiarElementosCotizacion: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Mapa de tipoelemento (en minúsculas) al nombre real de la tabla en Supabase
const TABLA_POR_TIPO: Record<string, string> = {
  lugar: "lugar",
  alimento: "platillos",
  alimentos: "platillos",
  platillo: "platillos",
  platillos: "platillos",
  bebidas: "bebidas",
  bebida: "bebidas",
  mobiliario: "mobiliario",
  servicio: "servicio",
  servicios: "servicios",
  cortesia: "cortesias",
  cortesias: "cortesias",
  "beneficios adicionales": "beneficiosadicionales",
  beneficiosadicionales: "beneficiosadicionales",
  audiovisual: "audiovisual",
}

function resolverTabla(tipo: string): string {
  const key = tipo.toLowerCase().trim()
  return TABLA_POR_TIPO[key] || key
}

function capitalizarPrimera(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Función: buscarLugaresPorHotel: busca lugares filtrando por hotelid
export async function buscarLugaresPorHotel(hotelid: number) {
  try {
    const { data, error } = await supabase
      .from("lugares")
      .select("*")
      .eq("hotelid", hotelid)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error buscando lugares por hotel: ", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en buscarLugaresPorHotel: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: modificarLugarCotizacion: update si ya existe lugar en cotización, insert si no
export async function modificarLugarCotizacion(cotizacionid: number, hotelid: number, elementoid: number) {
  try {
    const { data: existing, error: errorGet } = await supabase
      .from("elementosxcotizacion")
      .select("id")
      .eq("cotizacionid", cotizacionid)
      .eq("tipoelemento", "Lugar")
      .limit(1)

    if (errorGet) {
      console.error("Error verificando lugar existente: ", errorGet)
      return { success: false, error: errorGet.message }
    }

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from("elementosxcotizacion")
        .update({ elementoid, hotelid })
        .eq("cotizacionid", cotizacionid)
        .eq("tipoelemento", "Lugar")

      if (error) {
        console.error("Error actualizando lugar: ", error)
        return { success: false, error: error.message }
      }
    } else {
      const { error } = await supabase
        .from("elementosxcotizacion")
        .insert({ cotizacionid, hotelid, elementoid, tipoelemento: "Lugar" })

      if (error) {
        console.error("Error insertando lugar: ", error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error en modificarLugarCotizacion: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: buscarElementosPorTabla: busca elementos en la tabla correspondiente al tipoelemento
export async function buscarElementosPorTabla(tipo: string) {
  const tabla = resolverTabla(tipo)
  try {
    const { data, error } = await supabase
      .from(tabla)
      .select("*")
      .order("nombre", { ascending: true })

    if (error) {
      console.error(`Error buscando elementos en tabla ${tabla}: `, error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en buscarElementosPorTabla: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: agregarElementoACotizacion: agrega un elemento a elementosxcotizacion
export async function agregarElementoACotizacion(cotizacionid: number, hotelid: number, elementoid: number, tipoelemento: string) {
  const tipoCapitalizado = capitalizarPrimera(tipoelemento)
  try {
    const { data, error } = await supabase
      .from("elementosxcotizacion")
      .insert({ cotizacionid, hotelid, elementoid, tipoelemento: tipoCapitalizado })
      .select()

    if (error) {
      console.error("Error agregando elemento a cotización: ", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en agregarElementoACotizacion: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: asignarPaqueteACotizacion: copia elementos de elementosxpaquete a elementosxcotizacion
export async function asignarPaqueteACotizacion(cotizacionid: number, paqueteid: number, hotelid: number) {
  try {
    // Obtener todos los elementos del paquete
    const { data: elementosPaquete, error: errorGet } = await supabase
      .from("elementosxpaquete")
      .select("*")
      .eq("paqueteid", paqueteid)

    if (errorGet) {
      console.error("Error obteniendo elementos del paquete: ", errorGet)
      return { success: false, error: errorGet.message }
    }

    if (!elementosPaquete || elementosPaquete.length === 0) {
      return { success: false, error: "No se encontraron elementos para este paquete" }
    }

    // Transformar los elementos para la tabla elementosxcotizacion
    // Solo se copian las columnas que existen en elementosxcotizacion
    const elementosACopiar = elementosPaquete.map((el: any) => {
      const row: any = { cotizacionid, hotelid }
      if (el.elementoid !== undefined) row.elementoid = el.elementoid
      if (el.tipoelemento !== undefined) row.tipoelemento = el.tipoelemento
      if (el.destacado !== undefined) row.destacado = el.destacado
      if (el.orden !== undefined) row.orden = el.orden
      return row
    })

    // Insertar en elementosxcotizacion
    const { data, error: errorInsert } = await supabase
      .from("elementosxcotizacion")
      .insert(elementosACopiar)
      .select()

    if (errorInsert) {
      console.error("Error insertando elementos en cotización: ", errorInsert)
      return { success: false, error: errorInsert.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en asignarPaqueteACotizacion: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegablePaises: función que se utiliza para los dropdownlist y puede contener id y / o nombre
export async function listaDesplegablePaises(id = -1, descripcion = "") {
  try {
    // Query principal
    let query = supabase.from("paises").select("id, descripcion")

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.ilike("descripcion", `%${descripcion}%`)
    }

    // Ejecutar query
    query = query.order("descripcion", { ascending: true })

    // Varaibles y resultados del query
    const { data: resultados, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de paises: ", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = resultados
      ? resultados.map((resultado) => ({
          value: resultado.id.toString(),
          text: resultado.descripcion,
        }))
      : []

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegablePaises: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listDesplegableEstados: función que se utiliza para los dropdownlist y puede contener id, descripcion y paisid
export async function listDesplegableEstados(id = -1, descripcion = "", paisid = -1) {
  try {
    // Query principal
    let query = supabase.from("estados").select("id, descripcion")

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.ilike("descripcion", `%${descripcion}%`)
    }
    if (paisid !== -1) {
      query = query.eq("paisid", paisid)
    }

    // Ejecutar query
    query = query.order("descripcion", { ascending: true })

    // Variables y resultados del query
    const { data: resultados, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de estados: ", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = resultados
      ? resultados.map((resultado) => ({
          value: resultado.id.toString(),
          text: resultado.descripcion,
        }))
      : []

    return { success: true, data }
  } catch (error) {
    console.error("Error en listDesplegableEstados: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableCiudades: función que se utiliza para los dropdownlist y puede contener id, descripcion y estadoid
export async function listaDesplegableCiudades(id = -1, descripcion = "", estadoid = -1) {
  try {
    // Query principal
    let query = supabase.from("ciudades").select("id, descripcion")

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.ilike("descripcion", `%${descripcion}%`)
    }
    if (estadoid !== -1) {
      query = query.eq("estadoid", estadoid)
    }

    // Ejecutar query
    query = query.order("descripcion", { ascending: true })

    // Variables y resultados del query
    const { data: resultados, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de ciudades: ", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = resultados
      ? resultados.map((resultado) => ({
          value: resultado.id.toString(),
          text: resultado.descripcion,
        }))
      : []

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableCiudades: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// -- X Hoteles
// Función: listaDesplegablePaises: función que se utiliza para los dropdownlist y puede contener id y / o nombre
export async function listaDesplegablePaisesXHoteles(id = -1, descripcion = "") {
  try {
    const { data: hotelPaisIds, error: hotelError } = await supabase.from("hoteles").select("paisid")

    if (hotelError) {
      console.error("Error obteniendo paisid de hoteles: ", hotelError)
      return { success: false, error: hotelError.message }
    }

    // Extraer array de IDs únicos
    const paisIds = [...new Set(hotelPaisIds?.map((h) => h.paisid).filter((id) => id !== null))] || []

    if (paisIds.length === 0) {
      return { success: true, data: [] }
    }

    // Query principal con filtro usando los IDs obtenidos
    let query = supabase.from("paises").select("id, descripcion").in("id", paisIds)

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.ilike("descripcion", `%${descripcion}%`)
    }

    // Ejecutar query
    query = query.order("descripcion", { ascending: true })

    // Variables y resultados del query
    const { data: resultados, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de paises: ", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = resultados
      ? resultados.map((resultado) => ({
          value: resultado.id.toString(),
          text: resultado.descripcion,
        }))
      : []

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegablePaises: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listDesplegableEstados: función que se utiliza para los dropdownlist y puede contener id, descripcion y paisid
export async function listDesplegableEstadosXHoteles(id = -1, descripcion = "", paisid = -1) {
  try {
    const { data: hotelEstadoIds, error: hotelError } = await supabase.from("hoteles").select("estadoid")

    if (hotelError) {
      console.error("Error obteniendo estadoid de hoteles: ", hotelError)
      return { success: false, error: hotelError.message }
    }

    // Extraer array de IDs únicos
    const estadoIds = [...new Set(hotelEstadoIds?.map((h) => h.estadoid).filter((id) => id !== null))] || []

    if (estadoIds.length === 0) {
      return { success: true, data: [] }
    }

    // Query principal con filtro usando los IDs obtenidos
    let query = supabase.from("estados").select("id, descripcion").in("id", estadoIds)

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.ilike("descripcion", `%${descripcion}%`)
    }
    if (paisid !== -1) {
      query = query.eq("paisid", paisid)
    }

    // Ejecutar query
    query = query.order("descripcion", { ascending: true })

    // Variables y resultados del query
    const { data: resultados, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de estados: ", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = resultados
      ? resultados.map((resultado) => ({
          value: resultado.id.toString(),
          text: resultado.descripcion,
        }))
      : []

    return { success: true, data }
  } catch (error) {
    console.error("Error en listDesplegableEstados: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableCiudades: función que se utiliza para los dropdownlist y puede contener id, descripcion y estadoid
export async function listaDesplegableCiudadesXHoteles(id = -1, descripcion = "", estadoid = -1) {
  try {
    const { data: hotelCiudadIds, error: hotelError } = await supabase.from("hoteles").select("ciudadid")

    if (hotelError) {
      console.error("Error obteniendo ciudadid de hoteles: ", hotelError)
      return { success: false, error: hotelError.message }
    }

    // Extraer array de IDs únicos
    const ciudadIds = [...new Set(hotelCiudadIds?.map((h) => h.ciudadid).filter((id) => id !== null))] || []

    if (ciudadIds.length === 0) {
      return { success: true, data: [] }
    }

    // Query principal con filtro usando los IDs obtenidos
    let query = supabase.from("ciudades").select("id, descripcion").in("id", ciudadIds)

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.ilike("descripcion", `%${descripcion}%`)
    }
    if (estadoid !== -1) {
      query = query.eq("estadoid", estadoid)
    }

    // Ejecutar query
    query = query.order("descripcion", { ascending: true })

    // Variables y resultados del query
    const { data: resultados, error } = await query

    if (error) {
      console.error("Error obteniendo la lista desplegable de ciudades: ", error)
      return { success: false, error: error.message }
    }

    const data: ddlItem[] = resultados
      ? resultados.map((resultado) => ({
          value: resultado.id.toString(),
          text: resultado.descripcion,
        }))
      : []

    return { success: true, data }
  } catch (error) {
    console.error("Error en listaDesplegableCiudades: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
