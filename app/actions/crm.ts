"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import type {
  oOportunidad,
  oActividad,
  oTimelineEntry,
  oCliente360,
  oCRMDashboard,
  oCRMKPI,
  oPipelineFiltros,
  oCommandResult,
  EtapaPipelineId,
  TipoActividadId,
  ScoringLevel,
} from "@/types/crm"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  --------------------
  Funciones CRM
  --------------------
  * DASHBOARD
    - obtenerDashboardCRM(vendedorId?)

  * PIPELINE
    - obtenerPipeline(filtros)
    - moverOportunidad(oportunidadId, nuevaEtapa)
    - crearOportunidad(datos)

  * CLIENTE 360
    - obtenerCliente360(clienteId)

  * ACTIVIDADES
    - crearActividad(datos)
    - completarActividad(actividadId, resultado)
    - obtenerActividadesHoy(vendedorId)
    - obtenerActividadesPorCliente(clienteId)
    - obtenerActividadesPendientes(vendedorId)

  * BUSQUEDA GLOBAL
    - busquedaGlobal(query)
================================================== */

/* ==================================================
  Helpers: Map cotizacion estatus to pipeline stage
================================================== */
function mapEstatusToPipelineStage(estatus: string): EtapaPipelineId {
  const mapping: Record<string, EtapaPipelineId> = {
    "Borrador": "cotizada",
    "Enviada": "cotizada",
    "Aceptada": "en_seguimiento",
    "Pagada": "pagada",
    "Confirmada": "confirmada",
    "Realizada": "realizada",
    "Cancelada": "perdida",
  }
  return mapping[estatus] || "prospecto"
}

function calcularDiasDesde(fecha: string | null): number {
  if (!fecha) return 999
  const diff = Date.now() - new Date(fecha).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/* ==================================================
  DASHBOARD: obtenerDashboardCRM
================================================== */
export async function obtenerDashboardCRM(
  vendedorId?: number
): Promise<{ success: boolean; error: string; data: oCRMDashboard | null }> {
  try {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split("T")[0]
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split("T")[0]
    const hoyStr = ahora.toISOString().split("T")[0]

    // 1. KPIs — Cotizaciones del mes
    let queryCotMes = supabase
      .from("vw_oeventos")
      .select("*")
      .eq("activo", true)
      .gte("fechacreacion", inicioMes)
      .lte("fechacreacion", finMes + "T23:59:59")

    if (vendedorId) {
      queryCotMes = queryCotMes.eq("cotizadopor", vendedorId)
    }

    const { data: cotMes, error: errCotMes } = await queryCotMes

    // 2. All active cotizaciones for pipeline summary
    let queryAllCot = supabase
      .from("vw_oeventos")
      .select("*")
      .eq("activo", true)

    if (vendedorId) {
      queryAllCot = queryAllCot.eq("cotizadopor", vendedorId)
    }

    const { data: allCot, error: errAllCot } = await queryAllCot

    // 3. Reservaciones del mes (for revenue and conversion)
    let queryResMes = supabase
      .from("vw_oreservaciones")
      .select("*")
      .eq("activo", true)
      .gte("fechacreacion", inicioMes)

    if (vendedorId) {
      queryResMes = queryResMes.eq("creadopor", vendedorId)
    }

    const { data: resMes } = await queryResMes

    // 4. New clients this month
    let queryNewClients = supabase
      .from("vw_oclientes")
      .select("id, fechacreacion")
      .gte("fechacreacion", inicioMes)

    const { data: newClients } = await queryNewClients

    // 5. Activities for today
    const { data: actividadesData } = await supabase
      .from("actividades")
      .select("*")
      .eq("fecha", hoyStr)
      .eq("completada", false)
      .order("hora", { ascending: true })

    // 6. Cotizaciones por vencer (validohasta within next 7 days)
    const en7dias = new Date(ahora)
    en7dias.setDate(en7dias.getDate() + 7)
    const en7diasStr = en7dias.toISOString().split("T")[0]

    let queryCotVencer = supabase
      .from("vw_oeventos")
      .select("*")
      .eq("activo", true)
      .in("estatus", ["Borrador", "Enviada", "Aceptada"])
      .gte("validohasta", hoyStr)
      .lte("validohasta", en7diasStr)
      .order("validohasta", { ascending: true })

    if (vendedorId) {
      queryCotVencer = queryCotVencer.eq("cotizadopor", vendedorId)
    }

    const { data: cotVencer } = await queryCotVencer

    // Calculate KPIs
    const cotizacionesDelMes = cotMes?.length || 0
    const reservacionesMes = resMes?.length || 0
    const totalCotMesParaConversion = cotMes?.filter(c =>
      ["Confirmada", "Realizada", "Pagada"].includes(c.estatus)
    ).length || 0
    const tasaConversion = cotizacionesDelMes > 0
      ? Math.round((totalCotMesParaConversion / cotizacionesDelMes) * 100)
      : 0

    const revenueMensual = (resMes || []).reduce((sum: number, r: any) => {
      return sum + (Number(r.totalmonto) || 0)
    }, 0) + (cotMes || []).filter((c: any) => ["Pagada", "Confirmada", "Realizada"].includes(c.estatus)).reduce((sum: number, c: any) => {
      return sum + (Number(c.totalmonto) || 0)
    }, 0)

    const clientesNuevos = newClients?.length || 0

    // Average days to close: from creation to "Confirmada" or "Pagada"
    const cerradas = (allCot || []).filter((c: any) =>
      ["Pagada", "Confirmada", "Realizada"].includes(c.estatus) && c.fechacreacion && c.fechaactualizacion
    )
    const diasPromedioParaCerrar = cerradas.length > 0
      ? Math.round(cerradas.reduce((sum: number, c: any) => {
          const diff = new Date(c.fechaactualizacion).getTime() - new Date(c.fechacreacion).getTime()
          return sum + Math.floor(diff / (1000 * 60 * 60 * 24))
        }, 0) / cerradas.length)
      : 0

    const kpis: oCRMKPI = {
      cotizacionesDelMes,
      tasaConversion,
      revenueMensual,
      clientesNuevos,
      diasPromedioParaCerrar,
    }

    // Pipeline summary — count cotizaciones by derived stage
    const stageMap: Record<string, { cantidad: number; monto: number }> = {}
    const stages: EtapaPipelineId[] = [
      "prospecto", "visita_programada", "demo_realizada", "cotizada",
      "en_seguimiento", "negociacion", "pagada", "confirmada", "realizada", "perdida",
    ]

    stages.forEach(s => { stageMap[s] = { cantidad: 0, monto: 0 } })

    ;(allCot || []).forEach((c: any) => {
      const stage = mapEstatusToPipelineStage(c.estatus)
      if (stageMap[stage]) {
        stageMap[stage].cantidad++
        stageMap[stage].monto += Number(c.totalmonto) || 0
      }
    })

    const pipelineResumen = stages.map(etapa => ({
      etapa,
      cantidad: stageMap[etapa].cantidad,
      monto: stageMap[etapa].monto,
    }))

    // Map activities for today
    const actividadesHoy: oActividad[] = (actividadesData || []).map((a: any) => ({
      id: a.id,
      tipo: a.tipo || "tarea",
      fecha: a.fecha,
      hora: a.hora,
      descripcion: a.descripcion || "",
      clienteId: a.clienteid,
      clienteNombre: a.clientenombre || null,
      oportunidadId: a.oportunidadid,
      oportunidadFolio: null,
      vendedorId: a.vendedorid,
      vendedorNombre: null,
      completada: a.completada || false,
      resultado: a.resultado,
      notas: a.notas,
      fechaCreacion: a.fechacreacion || a.created_at,
    }))

    // Cotizaciones por vencer with color indicators
    const cotizacionesPorVencer = (cotVencer || []).map((c: any) => {
      const diasRestantes = calcularDiasDesde(hoyStr) === 0
        ? Math.ceil((new Date(c.validohasta).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((new Date(c.validohasta).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...c,
        diasRestantes,
        colorIndicador: diasRestantes > 3 ? "text-emerald-600" : diasRestantes >= 2 ? "text-amber-600" : "text-destructive",
      }
    })

    // Recent activity (last 10 cotizaciones/reservaciones ordered by date)
    const actividadReciente: oTimelineEntry[] = []
    ;(allCot || []).slice(0, 10).forEach((c: any) => {
      actividadReciente.push({
        id: `cot-${c.id}`,
        tipo: "cotizacion",
        titulo: `Cotizacion ${c.folio}`,
        descripcion: `${c.nombreevento} — ${c.hotel} — $${Number(c.totalmonto || 0).toLocaleString("es-MX")}`,
        fecha: c.fechacreacion || c.fechaactualizacion || "",
        icono: "FileText",
        color: "text-primary",
      })
    })

    actividadReciente.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    const dashboard: oCRMDashboard = {
      kpis,
      pipelineResumen,
      actividadesHoy,
      cotizacionesPorVencer,
      actividadReciente: actividadReciente.slice(0, 10),
    }

    return { success: true, error: "", data: dashboard }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerDashboardCRM: " + errorMessage, data: null }
  }
}

/* ==================================================
  PIPELINE: obtenerPipeline
================================================== */
export async function obtenerPipeline(
  filtros?: oPipelineFiltros
): Promise<{ success: boolean; error: string; data: Record<EtapaPipelineId, oOportunidad[]> | null }> {
  try {
    let query = supabase
      .from("vw_oeventos")
      .select("*")
      .eq("activo", true)
      .order("fechacreacion", { ascending: false })

    if (filtros?.vendedorId) {
      query = query.eq("cotizadopor", filtros.vendedorId)
    }
    if (filtros?.hotelId) {
      query = query.eq("hotelid", filtros.hotelId)
    }
    if (filtros?.tipoEvento) {
      query = query.eq("tipoevento", filtros.tipoEvento)
    }
    if (filtros?.fechaDesde) {
      query = query.gte("fechainicio", filtros.fechaDesde)
    }
    if (filtros?.fechaHasta) {
      query = query.lte("fechainicio", filtros.fechaHasta)
    }
    if (filtros?.busqueda) {
      const term = filtros.busqueda.trim()
      query = query.or(`folio.ilike.%${term}%,nombreevento.ilike.%${term}%,cliente.ilike.%${term}%`)
    }

    const { data: cotizaciones, error } = await query.limit(500)

    if (error) {
      return { success: false, error: "Error obteniendo pipeline: " + error.message, data: null }
    }

    // Initialize all stages
    const pipeline: Record<EtapaPipelineId, oOportunidad[]> = {
      prospecto: [],
      visita_programada: [],
      demo_realizada: [],
      cotizada: [],
      en_seguimiento: [],
      negociacion: [],
      pagada: [],
      confirmada: [],
      realizada: [],
      perdida: [],
    }

    // Map cotizaciones to opportunities and group by stage
    ;(cotizaciones || []).forEach((c: any) => {
      const etapa = mapEstatusToPipelineStage(c.estatus)
      const monto = Number(c.totalmonto) || 0

      // Apply amount filters if present
      if (filtros?.montoMin && monto < filtros.montoMin) return
      if (filtros?.montoMax && monto > filtros.montoMax) return

      const oportunidad: oOportunidad = {
        id: c.id,
        folio: c.folio || "",
        clienteId: c.clienteid,
        clienteNombre: c.cliente || "Sin cliente",
        clienteEmail: null,
        clienteTelefono: null,
        etapa,
        hotelId: c.hotelid,
        hotelNombre: c.hotel || "",
        salonId: c.salonid || null,
        salonNombre: c.salon || null,
        fechaEvento: c.fechainicio,
        monto,
        tipoEvento: c.tipoevento || "",
        vendedorId: c.cotizadopor || null,
        vendedorNombre: null,
        nombreEvento: c.nombreevento || "",
        numeroinvitados: c.numeroinvitados || null,
        validohasta: c.validohasta || null,
        diasDesdeUltimaActividad: calcularDiasDesde(c.fechaactualizacion || c.fechacreacion),
        fechaCreacion: c.fechacreacion || "",
        fechaActualizacion: c.fechaactualizacion || null,
      }

      pipeline[etapa].push(oportunidad)
    })

    return { success: true, error: "", data: pipeline }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerPipeline: " + errorMessage, data: null }
  }
}

/* ==================================================
  PIPELINE: moverOportunidad
================================================== */
export async function moverOportunidad(
  oportunidadId: number,
  nuevaEtapa: EtapaPipelineId
): Promise<{ success: boolean; error: string }> {
  try {
    // Map pipeline stage back to cotizacion estatus
    const stageToEstatus: Record<EtapaPipelineId, string> = {
      prospecto: "Borrador",
      visita_programada: "Borrador",
      demo_realizada: "Borrador",
      cotizada: "Enviada",
      en_seguimiento: "Aceptada",
      negociacion: "Aceptada",
      pagada: "Pagada",
      confirmada: "Confirmada",
      realizada: "Realizada",
      perdida: "Cancelada",
    }

    const nuevoEstatus = stageToEstatus[nuevaEtapa]
    if (!nuevoEstatus) {
      return { success: false, error: "Etapa no valida" }
    }

    const { error } = await supabase
      .from("cotizaciones")
      .update({
        estatus: nuevoEstatus,
        fechaactualizacion: new Date().toISOString(),
      })
      .eq("id", oportunidadId)

    if (error) {
      return { success: false, error: "Error moviendo oportunidad: " + error.message }
    }

    // Try to log activity (table may not exist yet)
    try {
      await supabase.from("actividades").insert({
        tipo: "seguimiento",
        fecha: new Date().toISOString().split("T")[0],
        hora: new Date().toTimeString().split(" ")[0].substring(0, 5),
        descripcion: `Oportunidad movida a etapa: ${nuevaEtapa}`,
        oportunidadid: oportunidadId,
        completada: true,
        resultado: `Cambio de estatus a ${nuevoEstatus}`,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Activity logging is best-effort
    }

    revalidatePath("/crm/pipeline")
    revalidatePath("/cotizaciones")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en moverOportunidad: " + errorMessage }
  }
}

/* ==================================================
  CLIENTE 360: obtenerCliente360
================================================== */
export async function obtenerCliente360(
  clienteId: number
): Promise<{ success: boolean; error: string; data: oCliente360 | null }> {
  try {
    // 1. Client data
    const { data: cliente, error: errCliente } = await supabase
      .from("vw_oclientes")
      .select("*")
      .eq("id", clienteId)
      .maybeSingle()

    if (errCliente || !cliente) {
      return { success: false, error: "Cliente no encontrado", data: null }
    }

    // 2. Client's cotizaciones
    const { data: cotizaciones } = await supabase
      .from("vw_oeventos")
      .select("*")
      .eq("clienteid", clienteId)
      .eq("activo", true)
      .order("fechacreacion", { ascending: false })

    // 3. Client's reservaciones
    const { data: reservaciones } = await supabase
      .from("vw_oreservaciones")
      .select("*")
      .eq("clienteid", clienteId)
      .eq("activo", true)
      .order("fechacreacion", { ascending: false })

    // 4. Client's activities (try, table may not exist)
    let actividades: oActividad[] = []
    try {
      const { data: actData } = await supabase
        .from("actividades")
        .select("*")
        .eq("clienteid", clienteId)
        .order("fecha", { ascending: false })
        .limit(50)

      actividades = (actData || []).map((a: any) => ({
        id: a.id,
        tipo: a.tipo || "tarea",
        fecha: a.fecha,
        hora: a.hora,
        descripcion: a.descripcion || "",
        clienteId: a.clienteid,
        clienteNombre: cliente.nombre || null,
        oportunidadId: a.oportunidadid,
        oportunidadFolio: null,
        vendedorId: a.vendedorid,
        vendedorNombre: null,
        completada: a.completada || false,
        resultado: a.resultado,
        notas: a.notas,
        fechaCreacion: a.created_at || a.fechacreacion,
      }))
    } catch {
      // Activities table may not exist
    }

    // 5. Build timeline
    const timeline: oTimelineEntry[] = []

    ;(cotizaciones || []).forEach((c: any) => {
      timeline.push({
        id: `cot-${c.id}`,
        tipo: "cotizacion",
        titulo: `Cotizacion ${c.folio} creada`,
        descripcion: `${c.nombreevento} — ${c.hotel} — $${Number(c.totalmonto || 0).toLocaleString("es-MX")}`,
        fecha: c.fechacreacion,
        icono: "FileText",
        color: "text-primary",
      })
      if (c.estatus && c.estatus !== "Borrador") {
        timeline.push({
          id: `cot-status-${c.id}`,
          tipo: "cambio_estatus",
          titulo: `Cotizacion ${c.folio} cambio a ${c.estatus}`,
          descripcion: null,
          fecha: c.fechaactualizacion || c.fechacreacion,
          icono: "ArrowRight",
          color: "text-muted-foreground",
        })
      }
    })

    ;(reservaciones || []).forEach((r: any) => {
      timeline.push({
        id: `res-${r.id}`,
        tipo: "reservacion",
        titulo: `Reservacion confirmada: ${r.nombreevento}`,
        descripcion: `${r.hotel} — $${Number(r.totalmonto || 0).toLocaleString("es-MX")}`,
        fecha: r.fechacreacion,
        icono: "Calendar",
        color: "text-emerald-600",
      })
    })

    actividades.forEach((a) => {
      timeline.push({
        id: `act-${a.id}`,
        tipo: "actividad",
        titulo: `${a.tipo}: ${a.descripcion}`,
        descripcion: a.resultado || a.notas || null,
        fecha: a.fecha,
        icono: "Activity",
        color: "text-blue-600",
      })
    })

    // Sort timeline by date descending
    timeline.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    // Calculate scoring based on data
    let scoring: ScoringLevel = "frio"
    const hasCotizaciones = (cotizaciones || []).length > 0
    const hasReservaciones = (reservaciones || []).length > 0
    const hasRecentActivity = actividades.some(a => calcularDiasDesde(a.fecha) < 7)
    const hasFechaEvento = (cotizaciones || []).some((c: any) => c.fechainicio)

    if (hasReservaciones || hasFechaEvento) {
      scoring = "caliente"
    } else if (hasCotizaciones || hasRecentActivity) {
      scoring = "tibio"
    }

    // Calculate statistics
    const totalCotizaciones = (cotizaciones || []).length
    const totalReservaciones = (reservaciones || []).length
    const montoTotal = (cotizaciones || []).reduce((sum: number, c: any) => sum + (Number(c.totalmonto) || 0), 0) +
      (reservaciones || []).reduce((sum: number, r: any) => sum + (Number(r.totalmonto) || 0), 0)
    const ultimaActividad = timeline.length > 0 ? timeline[0].fecha : null

    // Tags — derived from data
    const tags: string[] = []
    if (cliente.tipo) tags.push(cliente.tipo)
    if (cliente.fuente) tags.push(cliente.fuente)
    if (hasReservaciones) tags.push("Con reservaciones")
    if (hasCotizaciones) tags.push("Con cotizaciones")

    const result: oCliente360 = {
      cliente,
      scoring,
      tags,
      timeline,
      cotizaciones: cotizaciones || [],
      reservaciones: reservaciones || [],
      actividades,
      estadisticas: {
        totalCotizaciones,
        totalReservaciones,
        montoTotal,
        ultimaActividad,
      },
    }

    return { success: true, error: "", data: result }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerCliente360: " + errorMessage, data: null }
  }
}

/* ==================================================
  ACTIVIDADES: crearActividad
================================================== */
export async function crearActividad(datos: {
  tipo: TipoActividadId
  fecha: string
  hora?: string
  descripcion: string
  clienteId?: number
  oportunidadId?: number
  vendedorId: number
  notas?: string
}): Promise<{ success: boolean; error: string; data: { id: number } | null }> {
  try {
    if (!datos.descripcion || datos.descripcion.trim() === "") {
      return { success: false, error: "La descripcion es requerida", data: null }
    }
    if (!datos.fecha) {
      return { success: false, error: "La fecha es requerida", data: null }
    }

    const { data, error } = await supabase
      .from("actividades")
      .insert({
        tipo: datos.tipo,
        fecha: datos.fecha,
        hora: datos.hora || null,
        descripcion: datos.descripcion,
        clienteid: datos.clienteId || null,
        oportunidadid: datos.oportunidadId || null,
        vendedorid: datos.vendedorId,
        notas: datos.notas || null,
        completada: false,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      return { success: false, error: "Error creando actividad: " + error.message, data: null }
    }

    revalidatePath("/crm")
    revalidatePath("/crm/actividades")
    return { success: true, error: "", data: { id: data.id } }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en crearActividad: " + errorMessage, data: null }
  }
}

/* ==================================================
  ACTIVIDADES: completarActividad
================================================== */
export async function completarActividad(
  actividadId: number,
  resultado: string
): Promise<{ success: boolean; error: string }> {
  try {
    const { error } = await supabase
      .from("actividades")
      .update({
        completada: true,
        resultado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actividadId)

    if (error) {
      return { success: false, error: "Error completando actividad: " + error.message }
    }

    revalidatePath("/crm")
    revalidatePath("/crm/actividades")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en completarActividad: " + errorMessage }
  }
}

/* ==================================================
  ACTIVIDADES: obtenerActividadesHoy
================================================== */
export async function obtenerActividadesHoy(
  vendedorId?: number
): Promise<{ success: boolean; error: string; data: oActividad[] | null }> {
  try {
    const hoyStr = new Date().toISOString().split("T")[0]

    let query = supabase
      .from("actividades")
      .select("*")
      .eq("fecha", hoyStr)
      .order("hora", { ascending: true })

    if (vendedorId) {
      query = query.eq("vendedorid", vendedorId)
    }

    const { data, error } = await query

    if (error) {
      return { success: true, error: "", data: [] }
    }

    const actividades: oActividad[] = (data || []).map((a: any) => ({
      id: a.id,
      tipo: a.tipo || "tarea",
      fecha: a.fecha,
      hora: a.hora,
      descripcion: a.descripcion || "",
      clienteId: a.clienteid,
      clienteNombre: null,
      oportunidadId: a.oportunidadid,
      oportunidadFolio: null,
      vendedorId: a.vendedorid,
      vendedorNombre: null,
      completada: a.completada || false,
      resultado: a.resultado,
      notas: a.notas,
      fechaCreacion: a.created_at,
    }))

    return { success: true, error: "", data: actividades }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerActividadesHoy: " + errorMessage, data: null }
  }
}

/* ==================================================
  ACTIVIDADES: obtenerActividadesPendientes
================================================== */
export async function obtenerActividadesPendientes(
  vendedorId?: number,
  vista: "hoy" | "vencidas" | "proximas7" | "todas" = "hoy"
): Promise<{ success: boolean; error: string; data: oActividad[] | null }> {
  try {
    const hoyStr = new Date().toISOString().split("T")[0]
    const en7dias = new Date()
    en7dias.setDate(en7dias.getDate() + 7)
    const en7diasStr = en7dias.toISOString().split("T")[0]

    let query = supabase
      .from("actividades")
      .select("*")
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true })

    if (vendedorId) {
      query = query.eq("vendedorid", vendedorId)
    }

    switch (vista) {
      case "hoy":
        query = query.eq("fecha", hoyStr)
        break
      case "vencidas":
        query = query.lt("fecha", hoyStr).eq("completada", false)
        break
      case "proximas7":
        query = query.gte("fecha", hoyStr).lte("fecha", en7diasStr)
        break
      case "todas":
        // No additional filter
        break
    }

    const { data, error } = await query.limit(100)

    if (error) {
      return { success: true, error: "", data: [] }
    }

    const actividades: oActividad[] = (data || []).map((a: any) => ({
      id: a.id,
      tipo: a.tipo || "tarea",
      fecha: a.fecha,
      hora: a.hora,
      descripcion: a.descripcion || "",
      clienteId: a.clienteid,
      clienteNombre: null,
      oportunidadId: a.oportunidadid,
      oportunidadFolio: null,
      vendedorId: a.vendedorid,
      vendedorNombre: null,
      completada: a.completada || false,
      resultado: a.resultado,
      notas: a.notas,
      fechaCreacion: a.created_at,
    }))

    return { success: true, error: "", data: actividades }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerActividadesPendientes: " + errorMessage, data: null }
  }
}

/* ==================================================
  BUSQUEDA GLOBAL: busquedaGlobal
================================================== */
export async function busquedaGlobal(
  query: string
): Promise<{ success: boolean; error: string; data: oCommandResult[] | null }> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, error: "", data: [] }
    }

    const term = query.trim()
    const results: oCommandResult[] = []

    // Search clients
    const { data: clientes } = await supabase
      .from("vw_oclientes")
      .select("id, nombre, apellidopaterno, email, telefono, compañia")
      .or(`nombre.ilike.%${term}%,apellidopaterno.ilike.%${term}%,email.ilike.%${term}%,telefono.ilike.%${term}%`)
      .limit(5)

    ;(clientes || []).forEach((c: any) => {
      results.push({
        id: `cliente-${c.id}`,
        tipo: "cliente",
        titulo: `${c.nombre || ""} ${c.apellidopaterno || ""}`.trim(),
        subtitulo: c.email || c.telefono || c.compañia || "",
        url: `/crm/clientes/${c.id}`,
        icono: "Users",
      })
    })

    // Search cotizaciones
    const { data: cotizaciones } = await supabase
      .from("vw_oeventos")
      .select("id, folio, nombreevento, cliente, hotel, estatus")
      .eq("activo", true)
      .or(`folio.ilike.%${term}%,nombreevento.ilike.%${term}%,cliente.ilike.%${term}%`)
      .limit(5)

    ;(cotizaciones || []).forEach((c: any) => {
      results.push({
        id: `cotizacion-${c.id}`,
        tipo: "cotizacion",
        titulo: `${c.folio} — ${c.nombreevento}`,
        subtitulo: `${c.cliente || ""} | ${c.hotel || ""} | ${c.estatus}`,
        url: `/cotizaciones/${c.id}`,
        icono: "FileText",
      })
    })

    // Search reservaciones
    const { data: reservaciones } = await supabase
      .from("vw_oreservaciones")
      .select("id, folio, nombreevento, cliente, hotel, estatus")
      .eq("activo", true)
      .or(`folio.ilike.%${term}%,nombreevento.ilike.%${term}%,cliente.ilike.%${term}%`)
      .limit(5)

    ;(reservaciones || []).forEach((r: any) => {
      results.push({
        id: `reservacion-${r.id}`,
        tipo: "reservacion",
        titulo: `${r.folio} — ${r.nombreevento}`,
        subtitulo: `${r.cliente || ""} | ${r.hotel || ""} | ${r.estatus}`,
        url: `/reservaciones/${r.id}`,
        icono: "Calendar",
      })
    })

    return { success: true, error: "", data: results }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en busquedaGlobal: " + errorMessage, data: null }
  }
}

/* ==================================================
  SPECIAL: obtenerContadorActividades (for sidebar badge)
================================================== */
export async function obtenerContadorActividades(
  vendedorId?: number
): Promise<{ success: boolean; pendientes: number; vencidas: number }> {
  try {
    const hoyStr = new Date().toISOString().split("T")[0]

    // Count today's pending
    let queryHoy = supabase
      .from("actividades")
      .select("id", { count: "exact", head: true })
      .eq("fecha", hoyStr)
      .eq("completada", false)

    if (vendedorId) {
      queryHoy = queryHoy.eq("vendedorid", vendedorId)
    }

    const { count: pendientes } = await queryHoy

    // Count overdue
    let queryVencidas = supabase
      .from("actividades")
      .select("id", { count: "exact", head: true })
      .lt("fecha", hoyStr)
      .eq("completada", false)

    if (vendedorId) {
      queryVencidas = queryVencidas.eq("vendedorid", vendedorId)
    }

    const { count: vencidas } = await queryVencidas

    return { success: true, pendientes: pendientes || 0, vencidas: vencidas || 0 }
  } catch {
    return { success: true, pendientes: 0, vencidas: 0 }
  }
}
