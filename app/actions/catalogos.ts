"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import type { ddlItem } from "@/types/common"

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
// Función: listaEstatusReservacion: obtiene id y nombre de estatus donde seccion = 'Reservacion'
export async function listaEstatusReservacion() {
  try {
    const { data, error } = await supabase
      .from("estatus")
      .select("id, nombre")
      .eq("seccion", "Reservacion")
      .order("orden", { ascending: true })

    if (error) {
      console.error("Error obteniendo estatus de reservación:", error)
      return { success: false, error: error.message }
    }

    const lista = (data || []).map((r: any) => ({ value: r.id.toString(), text: r.nombre }))
    return { success: true, data: lista }
  } catch (error) {
    console.error("Error en listaEstatusReservacion:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaEstatusSeguimiento: obtiene id y nombre de estatus donde seccion = 'Seguimiento y objeciones'
export async function listaEstatusSeguimiento() {
  try {
    const { data, error } = await supabase
      .from("estatus")
      .select("id, nombre")
      .eq("seccion", "Seguimiento y objeciones")
      .order("orden", { ascending: true })

    if (error) {
      console.error("Error obteniendo estatus de seguimiento:", error)
      return { success: false, error: error.message }
    }

    const lista = (data || []).map((r: any) => ({ value: r.id.toString(), text: r.nombre }))
    return { success: true, data: lista }
  } catch (error) {
    console.error("Error en listaEstatusSeguimiento:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaEstatusCotizacion: obtiene id y nombre de estatus filtrado por seccion (default 'Cotizacion')
export async function listaEstatusCotizacion(seccion = "Cotizacion") {
  try {
    const { data, error } = await supabase
      .from("estatus")
      .select("id, nombre")
      .eq("seccion", seccion)
      .order("orden", { ascending: true })

    if (error) {
      console.error("Error obteniendo estatus de cotización:", error)
      return { success: false, error: error.message }
    }

    const lista = (data || []).map((r: any) => ({ value: r.id.toString(), text: r.nombre }))
    return { success: true, data: lista }
  } catch (error) {
    console.error("Error en listaEstatusCotizacion:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: listaDesplegableTipoEvento: obtiene id y nombre de la tabla tipoevento
export async function listaDesplegableTipoEvento(categoriaevento = "") {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabaseClient
      .from("tipoevento")
      .select("id, nombre")

    if (categoriaevento !== "") {
      query = query.eq("categoriaevento", Number(categoriaevento))
    }

    const { data: resultados, error } = await query.order("nombre", { ascending: true })

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

// Función: listaDesplegablePaquetes: obtiene paquetes de vw_paquetes
// Si se pasa hotelid, filtra por esa columna. Enriquece con tipopaquete de la tabla paquetes.
export async function listaDesplegablePaquetes(_tipoeventoid?: number, hotelid?: number) {
  try {
    let query = supabase.from("vw_paquetes").select("*").order("nombre", { ascending: true })
    if (hotelid != null && Number.isFinite(hotelid) && hotelid > 0) {
      query = query.eq("hotelid", hotelid)
    }
    const { data: resultados, error } = await query

    if (error) {
      console.error("Error obteniendo paquetes: ", error)
      return { success: false, error: error.message }
    }

    // Enriquecer con tipopaquete y precioporpersona de tabla paquetes
    if (resultados && resultados.length > 0) {
      const ids = resultados.map((r: any) => r.id)
      const { data: paqData } = await supabase.from("paquetes").select("id, tipopaquete, precioporpersona").in("id", ids)
      if (paqData) {
        const paqMap = new Map(paqData.map((p: any) => [p.id, p]))
        for (const r of resultados) {
          const p = paqMap.get(r.id) as any
          (r as any).tipopaquete = p?.tipopaquete || "Simple"
          ;(r as any).precioporpersona = p?.precioporpersona ?? null
        }
      }
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

    // La vista vw_elementocotizacion no incluye los registros con tipoelemento='Consumo'.
    // Los obtenemos manualmente desde elementosxcotizacion y los unimos con la tabla bebidas
    // para devolver nombre/descripcion/costo en la misma forma que los demás renglones.
    const { data: consumoRows } = await supabase
      .from("elementosxcotizacion")
      .select("*")
      .eq("reservacionid", cotizacionid)
      .eq("tipoelemento", "Consumo")

    let consumoEnriched: any[] = []
    if (consumoRows && consumoRows.length > 0) {
      const ids = consumoRows.map((r: any) => r.elementoid).filter(Boolean)
      const { data: beb } = await supabase
        .from("bebidas")
        .select("id, nombre, descripcion, costo, menubebidaid, documentopdf")
        .in("id", ids)
      const bebMap = new Map((beb || []).map((b: any) => [Number(b.id), b]))

      // Joinear bebidaprecios para los que tengan bebidaprecioid
      const precioIds = consumoRows.map((r: any) => r.bebidaprecioid).filter(Boolean)
      let precioMap = new Map<number, any>()
      if (precioIds.length > 0) {
        const { data: precios } = await supabase
          .from("bebidaprecios")
          .select("id, horas, precioporpersona")
          .in("id", precioIds)
        precioMap = new Map((precios || []).map((p: any) => [Number(p.id), p]))
      }

      consumoEnriched = consumoRows.map((r: any) => {
        const b = bebMap.get(Number(r.elementoid)) as any
        const p = r.bebidaprecioid ? (precioMap.get(Number(r.bebidaprecioid)) as any) : null
        return {
          ...r,
          cotizacionid,
          nombre: b?.nombre || "",
          descripcion: b?.descripcion || "",
          elemento: b?.nombre || b?.descripcion || "",
          costo: b?.costo ?? null,
          documentopdf: b?.documentopdf || null,
          bebidaprecio: p ? { id: p.id, horas: p.horas, precioporpersona: p.precioporpersona } : null,
        }
      })
    }

    return { success: true, data: [...(resultados || []), ...consumoEnriched] }
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
      .eq("reservacionid", cotizacionid)
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
      .eq("reservacionid", cotizacionid)

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
  alimento: "menus",
  alimentos: "menus",
  platillo: "platillos",
  platillos: "platillos",
  bebidas: "menubebidas",
  bebida: "menubebidas",
  consumo: "bebidas",
  mobiliario: "mobiliario",
  servicio: "servicio",
  servicios: "servicios",
  cortesia: "cortesias",
  cortesias: "cortesias",
  "beneficios adicionales": "beneficiosadicionales",
  beneficiosadicionales: "beneficiosadicionales",
  audiovisual: "audiovisual",
  complemento: "complementos",
  complementos: "complementos",
}

function resolverTabla(tipo: string): string {
  const key = tipo.toLowerCase().trim()
  return TABLA_POR_TIPO[key] || key
}

// Mapa de clave de sección (UI) al valor canónico que se guarda en tipoelemento
const TIPO_CANONICO: Record<string, string> = {
  alimentos: "Alimento",
  alimento: "Alimento",
  platillo: "Platillo",
  platillos: "Platillo",
  bebidas: "Bebidas",
  bebida: "Bebidas",
  consumo: "Consumo",
  cortesias: "Cortesias",
  cortesia: "Cortesias",
  servicios: "Servicio",
  servicio: "Servicio",
  mobiliario: "Mobiliario",
  audiovisual: "Audiovisual",
  beneficiosadicionales: "Beneficios Adicionales",
  "beneficios adicionales": "Beneficios Adicionales",
  lugar: "Lugar",
}

function normalizarTipoElemento(tipo: string): string {
  const key = tipo.toLowerCase().trim()
  return TIPO_CANONICO[key] ?? (tipo.charAt(0).toUpperCase() + tipo.slice(1))
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
      .eq("reservacionid", cotizacionid)
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
        .eq("reservacionid", cotizacionid)
        .eq("tipoelemento", "Lugar")

      if (error) {
        console.error("Error actualizando lugar: ", error)
        return { success: false, error: error.message }
      }
    } else {
      const { error } = await supabase
        .from("elementosxcotizacion")
        .insert({ reservacionid: cotizacionid, hotelid, elementoid, tipoelemento: "Lugar" })

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

// Función: obtenerDocumentoPDF: obtiene la URL del documentoPDF de un elemento en platillos o bebidas
export async function obtenerDocumentoPDF(elementoid: number, tipo: string) {
  const tabla = resolverTabla(tipo)
  try {
    const { data, error } = await supabase
      .from(tabla)
      .select("documentopdf")
      .eq("id", elementoid)
      .single()
    if (error) return { success: false, pdf: null }
    return { success: true, pdf: (data as any)?.documentopdf ?? null }
  } catch {
    return { success: false, pdf: null }
  }
}

// Función: buscarElementosPorTabla: busca elementos en la tabla correspondiente al tipoelemento
// Si se pasa hotelid, filtra por esa columna (aplica a tablas que tienen hotelid: menus, platillos, mobiliario, etc.)
export async function buscarElementosPorTabla(tipo: string, hotelid?: number | null) {
  const tabla = resolverTabla(tipo)
  try {
    let query = supabase
      .from(tabla)
      .select("*")
      .order("nombre", { ascending: true })

    if (hotelid != null && hotelid > 0) {
      query = query.eq("hotelid", hotelid)
    }

    const { data, error } = await query

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

// Función: buscarConsumoPorMenu: busca bebidas filtrando por menubebidaid
// Además, para cada bebida busca sus opciones de bebidaprecios (horas + precioporpersona)
export async function buscarConsumoPorMenu(menubebidaid: number) {
  try {
    const { data: bebidas, error } = await supabase
      .from("bebidas")
      .select("*")
      .eq("menubebidaid", menubebidaid)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error buscando consumo por menubebida: ", error)
      return { success: false, error: error.message }
    }

    if (!bebidas || bebidas.length === 0) return { success: true, data: [] }

    const bebidaIds = bebidas.map((b: any) => b.id).filter(Boolean)
    const { data: precios } = await supabase
      .from("bebidaprecios")
      .select("*")
      .in("bebidaid", bebidaIds)

    const preciosMap = new Map<number, any[]>()
    for (const p of (precios || [])) {
      const bid = Number((p as any).bebidaid)
      if (!preciosMap.has(bid)) preciosMap.set(bid, [])
      preciosMap.get(bid)!.push(p)
    }
    for (const [, arr] of preciosMap) {
      arr.sort((a: any, b: any) => Number(a.horas || 0) - Number(b.horas || 0))
    }

    const enriched = bebidas.map((b: any) => ({
      ...b,
      precios: preciosMap.get(Number(b.id)) || [],
    }))

    return { success: true, data: enriched }
  } catch (error) {
    console.error("Error en buscarConsumoPorMenu: ", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: duplicarElementosReservacion: copia todos los elementosxcotizacion de una reservación
// fuente a una reservación destino (nuevo reservacionid).
export async function duplicarElementosReservacion(sourceReservacionId: number, targetReservacionId: number) {
  try {
    const { data: srcRows, error: errSel } = await supabase
      .from("elementosxcotizacion")
      .select("*")
      .eq("reservacionid", sourceReservacionId)
    if (errSel) {
      console.error("Error leyendo elementos fuente:", errSel)
      return { success: false, error: errSel.message, inserted: 0 }
    }
    if (!srcRows || srcRows.length === 0) return { success: true, inserted: 0 }
    const toInsert = srcRows.map((r: any) => {
      // Quitar id para que el insert genere uno nuevo; sustituir reservacionid.
      const { id: _id, ...rest } = r
      return { ...rest, reservacionid: targetReservacionId }
    })
    const { error: errIns } = await supabase.from("elementosxcotizacion").insert(toInsert)
    if (errIns) {
      console.error("Error insertando elementos duplicados:", errIns)
      return { success: false, error: errIns.message, inserted: 0 }
    }
    return { success: true, inserted: toInsert.length }
  } catch (error: any) {
    console.error("Error en duplicarElementosReservacion:", error)
    return { success: false, error: error?.message || String(error), inserted: 0 }
  }
}

// Función: asignarPaqueteAReservacion: actualiza eventoxreservaciones.paqueteid
export async function asignarPaqueteAReservacion(reservacionId: number, paqueteId: number) {
  try {
    const { error } = await supabase
      .from("eventoxreservaciones")
      .update({ paqueteid: paqueteId })
      .eq("id", reservacionId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) }
  }
}

// Función: obtenerPrecioPaquetePorPlatillo: determina el precio del paquete.
// 1) Si paquetes.precioporpersona > 0, lo usa.
// 2) Si no, busca platillobaseid del platillo seleccionado y consulta paqueteprecios
//    filtrando por:
//      - paqueteid
//      - platobaseid (platillo clave: Plato Fuerte en Completos, o primero en Individuales)
//      - year (derivado del año de fechaInicio del evento)
//      - esfinsemana (true si el día de fechaInicio es Viernes o Sábado, false si es Domingo–Jueves)
// Los filtros year/esfinsemana solo se aplican si se recibe fechaInicio (retro-compatible con callers antiguos).
// Retorna info de debug para mostrar en el cliente si falla.
export async function obtenerPrecioPaquetePorPlatillo(paqueteId: number, platilloId: number, fechaInicio?: string) {
  const debug: any = { paqueteId, platilloId, fechaInicio }
  try {
    // Paso 1: precio directo del paquete
    const { data: paq, error: errPaq } = await supabase
      .from("paquetes")
      .select("precioporpersona")
      .eq("id", paqueteId)
      .maybeSingle()
    debug.paquete_precioporpersona = paq?.precioporpersona ?? null
    if (errPaq) debug.paquete_error = errPaq.message
    const precioDirecto = Number(paq?.precioporpersona ?? 0)
    if (precioDirecto > 0) return { success: true, precio: precioDirecto, debug }

    // Paso 2: obtener platillobaseid del platillo seleccionado
    const { data: platillo, error: errPlat } = await supabase
      .from("platillos")
      .select("platillobaseid")
      .eq("id", platilloId)
      .maybeSingle()
    debug.platillo_platillobaseid = platillo?.platillobaseid ?? null
    if (errPlat) debug.platillo_error = errPlat.message
    const platilloBaseId = platillo?.platillobaseid
    if (!platilloBaseId) return { success: true, precio: 0, debug }

    // Paso 3: derivar year + esfinsemana desde fechaInicio (si viene).
    // Día de semana: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb.
    // Fin de semana = Viernes (5) o Sábado (6); entre semana = Domingo (0) a Jueves (4).
    let year: number | null = null
    let esFinSemana: boolean | null = null
    if (fechaInicio) {
      const fechaStr = String(fechaInicio).slice(0, 10)
      const d = new Date(fechaStr + "T12:00:00")
      if (!isNaN(d.getTime())) {
        year = d.getFullYear()
        const dow = d.getDay()
        esFinSemana = dow === 5 || dow === 6
      }
    }
    debug.filtros_fecha = { year, esFinSemana }

    // Paso 4: consultar paqueteprecios con todos los filtros aplicables
    let query = supabase
      .from("paqueteprecios")
      .select("precioporpersona, year, esfinsemana")
      .eq("paqueteid", paqueteId)
      .eq("platobaseid", platilloBaseId)
    if (year != null) query = query.eq("year", year)
    if (esFinSemana != null) query = query.eq("esfinsemana", esFinSemana)

    const { data: ppRows, error: errPp } = await query.limit(1)
    debug.paqueteprecios_rows_filtered = ppRows
    if (errPp) debug.paqueteprecios_error = errPp.message

    // Si los filtros no devolvieron fila, diagnosticar: traer todas las filas de paqueteprecios
    // para ese paqueteid + platobaseid (sin filtros de fecha) para ver qué combinaciones existen.
    if ((!ppRows || ppRows.length === 0) && (year != null || esFinSemana != null)) {
      const { data: allRows, error: errAll } = await supabase
        .from("paqueteprecios")
        .select("precioporpersona, year, esfinsemana")
        .eq("paqueteid", paqueteId)
        .eq("platobaseid", platilloBaseId)
        .limit(10)
      debug.paqueteprecios_rows_disponibles = allRows
      if (errAll) debug.paqueteprecios_diag_error = errAll.message
    }

    const pp = (ppRows && ppRows.length > 0) ? ppRows[0] : null
    return { success: true, precio: Number(pp?.precioporpersona ?? 0), debug }
  } catch (error: any) {
    debug.exception = error?.message || String(error)
    return { success: false, precio: 0, debug }
  }
}

// Función: agregarElementoACotizacion: agrega un elemento a elementosxcotizacion
// Para tipoelemento="Consumo" acepta opcionalmente bebidaprecioid (precio/horas elegido).
export async function agregarElementoACotizacion(cotizacionid: number, hotelid: number, elementoid: number, tipoelemento: string, bebidaprecioid?: number) {
  const tipoCapitalizado = normalizarTipoElemento(tipoelemento)
  try {
    const row: any = { reservacionid: cotizacionid, hotelid, elementoid, tipoelemento: tipoCapitalizado }
    if (bebidaprecioid != null) row.bebidaprecioid = bebidaprecioid
    const { data, error } = await supabase
      .from("elementosxcotizacion")
      .insert(row)
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

// Función: obtenerElementosPaqueteOriginal: lista los elementos que pertenecen al paquete original
// Se usa para identificar qué elementos en la cotización son "adicionales" (no incluidos en el paquete).
export async function obtenerElementosPaqueteOriginal(paqueteid: number) {
  try {
    const { data, error } = await supabase
      .from("elementosxpaquete")
      .select("elementoid, tipoelemento")
      .eq("paqueteid", paqueteid)
    if (error) {
      console.error("Error obteniendo elementos originales del paquete: ", error)
      return { success: false, error: error.message, data: [] as { elementoid: number; tipoelemento: string }[] }
    }
    return { success: true, data: (data || []) as { elementoid: number; tipoelemento: string }[] }
  } catch (error) {
    console.error("Error en obtenerElementosPaqueteOriginal: ", error)
    return { success: false, error: "Error interno del servidor", data: [] as { elementoid: number; tipoelemento: string }[] }
  }
}

// Función: asignarPaqueteACotizacion: copia elementos de elementosxpaquete a elementosxcotizacion.
// `excludeElementoIds` permite omitir ciertos elementoids del paquete (ej. menús opcionales
// alternativos que el usuario NO eligió — solo se copia el que seleccionó).
export async function asignarPaqueteACotizacion(cotizacionid: number, paqueteid: number, hotelid: number, excludeElementoIds?: number[]) {
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

    const excludeSet = new Set((excludeElementoIds || []).map((n) => Number(n)))

    // Transformar los elementos para la tabla elementosxcotizacion (saltando los excluidos).
    // Solo se copian las columnas que existen en elementosxcotizacion.
    const elementosACopiar = elementosPaquete
      .filter((el: any) => !excludeSet.has(Number(el.elementoid)))
      .map((el: any) => {
        const row: any = { reservacionid: cotizacionid, hotelid }
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

    // Persistir paqueteid en eventoxreservaciones (id = reservacionid)
    const { error: errUpdRes } = await supabase
      .from("eventoxreservaciones")
      .update({ paqueteid })
      .eq("id", cotizacionid)
    if (errUpdRes) {
      console.error("Error actualizando paqueteid en eventoxreservaciones: ", errUpdRes)
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

// Función: obtenerPlatillosCotizacion: obtiene elementos de tipo 'Platillo' de una cotización
// uniendo elementosxcotizacion con platillos
export async function obtenerPlatillosCotizacion(cotizacionid: number) {
  try {
    const { data: elemRows, error: elemError } = await supabase
      .from("elementosxcotizacion")
      .select("*")
      .eq("reservacionid", cotizacionid)
      .eq("tipoelemento", "Platillo")

    if (elemError) {
      console.error("Error obteniendo platillos de cotización:", elemError)
      return { success: false, error: elemError.message }
    }

    if (!elemRows || elemRows.length === 0) return { success: true, data: [] }

    const ids = elemRows.map((e: any) => e.elementoid).filter(Boolean)
    const { data: itemRows, error: itemError } = await supabase
      .from("platillos")
      .select("*")
      .in("id", ids)

    if (itemError) {
      console.error("Error obteniendo platillos:", itemError)
      return { success: false, error: itemError.message }
    }

    const data = elemRows.map((e: any) => {
      const item = (itemRows || []).find((p: any) => p.id === e.elementoid) || {}
      return {
        ...e,
        nombre: item.nombre || item.descripcion || item.name || "",
        documentopdf: item.documentopdf || null,
        costo: item.costo ?? 0,
        tipo: item.tipo || null,
        menuid: item.menuid ?? null,
      }
    })

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerPlatillosCotizacion:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: buscarPlatillosItems: obtiene todos los registros de platillos para el dropdown de Agregar
export async function buscarPlatillosItems(menuid = -1, hotelid = -1, tipo: string | null = null) {
  try {
    let query = supabase
      .from("platillos")
      .select("*")

    if (menuid !== -1) {
      query = query.eq("menuid", menuid)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (tipo) {
      query = query.eq("tipo", tipo)
    }

    const { data, error } = await query.order("nombre", { ascending: true })

    if (error) {
      console.error("Error buscando platillos:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error en buscarPlatillosItems:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerFormatoCotizacion: obtiene el formato de cotización por hotelid
export async function obtenerFormatoCotizacion(hotelid: number) {
  try {
    const { data, error } = await supabase
      .from("formatocotizaciones")
      .select("*")
      .eq("hotelid", hotelid)
      .single()

    if (error) {
      console.error("Error obteniendo formato cotización:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerFormatoCotizacion:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Función: obtenerEmpresaPorCliente: busca en tabla empresas por contactoclienteid y devuelve el nombre
export async function obtenerEmpresaPorCliente(clienteid: number) {
  try {
    const { data, error } = await supabase
      .from("empresas")
      .select("nombre")
      .eq("contactoclienteid", clienteid)
      .maybeSingle()

    if (error) {
      console.error("Error obteniendo empresa por cliente:", error)
      return { success: false, error: error.message, nombre: "" }
    }

    return { success: true, error: "", nombre: data?.nombre || "" }
  } catch (error) {
    console.error("Error en obtenerEmpresaPorCliente:", error)
    return { success: false, error: "Error interno del servidor", nombre: "" }
  }
}

// Función: obtenerGrupoEmpresa: busca la empresa padre (grupo) a partir del id de la empresa
// 1. Busca empresapadreid en empresas donde id = empresaId
// 2. Con ese empresapadreid busca el nombre en empresas
export async function obtenerGrupoEmpresa(clienteid: number) {
  try {
    // Primero obtener el id de la empresa del cliente
    const { data: empresa, error: errorEmpresa } = await supabase
      .from("empresas")
      .select("id, empresapadreid")
      .eq("contactoclienteid", clienteid)
      .maybeSingle()

    if (errorEmpresa || !empresa || !empresa.empresapadreid) {
      return { success: false, error: errorEmpresa?.message || "Sin empresa padre", nombre: "" }
    }

    // Buscar el nombre de la empresa padre
    const { data: empresaPadre, error: errorPadre } = await supabase
      .from("empresas")
      .select("nombre")
      .eq("id", empresa.empresapadreid)
      .maybeSingle()

    if (errorPadre || !empresaPadre) {
      return { success: false, error: errorPadre?.message || "Empresa padre no encontrada", nombre: "" }
    }

    return { success: true, error: "", nombre: empresaPadre.nombre || "" }
  } catch (error) {
    console.error("Error en obtenerGrupoEmpresa:", error)
    return { success: false, error: "Error interno del servidor", nombre: "" }
  }
}

// Función: obtenerAudiovisualPorHotel: obtiene equipos audiovisuales de un hotel con nombre, descripcion, costosiniva
export async function obtenerAudiovisualPorHotel(hotelid: number) {
  try {
    const { data, error } = await supabase
      .from("audiovisual")
      .select("id, nombre, descripcion, costosiniva")
      .eq("hotelid", hotelid)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo audiovisual por hotel:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, error: "", data: data || [] }
  } catch (error) {
    console.error("Error en obtenerAudiovisualPorHotel:", error)
    return { success: false, error: "Error interno del servidor", data: [] }
  }
}

// Función: obtenerComplementosPorHotel: obtiene complementos de un hotel con nombre, descripcion, costo, cantidad y unidad
export async function obtenerComplementosPorHotel(hotelid: number) {
  try {
    const { data, error } = await supabase
      .from("complementos")
      .select("id, nombre, descripcion, costo, cantidad, unidad")
      .eq("hotelid", hotelid)
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error obteniendo complementos por hotel:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, error: "", data: data || [] }
  } catch (error) {
    console.error("Error en obtenerComplementosPorHotel:", error)
    return { success: false, error: "Error interno del servidor", data: [] }
  }
}

// Función: obtenerPlatilloItemPorId: obtiene nombre, descripcion y costo de un platillos por id
export async function obtenerPlatilloItemPorId(id: number) {
  try {
    const { data, error } = await supabase
      .from("platillos")
      .select("id, nombre, descripcion, costo, horas")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("Error obteniendo platillo item:", error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, error: "", data }
  } catch (error) {
    console.error("Error en obtenerPlatilloItemPorId:", error)
    return { success: false, error: "Error interno del servidor", data: null }
  }
}

// Función: obtenerUsuarioSesionActual: obtiene datos del usuario logueado para el PDF
export async function obtenerUsuarioSesionActual() {
  try {
    const { obtenerSesion } = await import("@/app/actions/session")
    const sesion = await obtenerSesion()
    if (!sesion || !sesion.UsuarioId) return { success: false, error: "No hay sesión activa" }

    const { data, error } = await supabase
      .from("usuarios")
      .select("nombrecompleto, email, telefono, puesto")
      .eq("id", Number(sesion.UsuarioId))
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error("Error en obtenerUsuarioSesionActual:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
