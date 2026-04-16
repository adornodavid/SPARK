"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  Pipedrive Config
================================================== */
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN!
const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1"

/* ==================================================
  Hash keys de campos personalizados Pipedrive
================================================== */
const CF = {
  division_filial: "50911942c4dd600eefb3caa67e7e1e56ad29f4aa",
  tipo_contacto: "cef83686b7220cf87d20abbe0c052ec6b1fc0bb0",
  tipo_reservas: "b69ae48b043bdac3605ee201c13584896f68341f",
  potencial_mensual: "aa2812f834931c14bb00f9d96527feb7d8f55afb",
  cumpleanos: "e645f305b4a9daa4667ed77740275956f7bbd4e1",
  afiliado_fidelizacion: "8026c65fb29f02149c91058368a15b3c358eba94",
  whatsapp_link: "a3e32f5283601e7ce30bd2db74a5fef0e741921a",
  dir: "be06a860548544971341a3dfe60f003de819e08e",
} as const

/* ==================================================
  Tipos
================================================== */
export type ErrorDetalle = {
  pipedrive_id: number
  nombre: string
  error: string
}

export type LoteResultado = {
  success: boolean
  insertados: number
  omitidos: number
  errores: number
  erroresDetalle: ErrorDetalle[]
  total_lote: number
  hay_mas: boolean
  next_start: number
  mensaje: string
}

export type PersonRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  primer_nombre: string | null
  apellidos: string | null
  puesto: string | null
  email: any
  telefono: any
  organizacion_nombre: string | null
  propietario_nombre: string | null
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

/* ==================================================
  Helpers defensivos para mapeo
  - truncate: recorta strings al tamaño max de la columna
  - safeDate: descarta fechas inválidas (año 0, formato malo)
================================================== */
function truncate(value: any, max: number): string | null {
  if (value === null || value === undefined) return null
  const s = String(value)
  if (s.length === 0) return null
  return s.length > max ? s.slice(0, max) : s
}

function safeDate(value: any): string | null {
  if (!value) return null
  const s = String(value).trim()
  // Rechaza año 0000 o fechas con año fuera de rango Postgres (1..9999)
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const year = parseInt(match[1], 10)
  if (year < 1900 || year > 2100) return null
  return s
}

/* ==================================================
  Mapear person de Pipedrive → row Supabase
================================================== */
function mapPersonToRow(p: any) {
  return {
    pipedrive_id: p.id,
    nombre: truncate(p.name, 255),
    primer_nombre: truncate(p.first_name, 150),
    apellidos: truncate(p.last_name, 150),
    puesto: truncate(p.job_title, 255),
    email: p.email || [],
    telefono: p.phone || [],
    mensajeria_instantanea: truncate(p.im?.[0]?.value, 255),
    organizacion_id: typeof p.org_id === "object" ? p.org_id?.value : p.org_id || null,
    organizacion_nombre: truncate(typeof p.org_id === "object" ? p.org_id?.name : p.org_name, 255),
    propietario_id: typeof p.owner_id === "object" ? p.owner_id?.id : p.owner_id || null,
    propietario_nombre: truncate(typeof p.owner_id === "object" ? p.owner_id?.name : p.owner_name, 255),
    direccion_postal: p.postal_address || null,
    direccion_subpremise: truncate(p.postal_address_subpremise, 100),
    direccion_numero_casa: truncate(p.postal_address_street_number, 50),
    direccion_calle: truncate(p.postal_address_route, 255),
    direccion_sublocalidad: truncate(p.postal_address_sublocality, 255),
    direccion_ciudad: truncate(p.postal_address_locality, 255),
    direccion_estado: truncate(p.postal_address_admin_area_level_1, 255),
    direccion_region: truncate(p.postal_address_admin_area_level_2, 255),
    direccion_pais: truncate(p.postal_address_country, 255),
    direccion_codigo_postal: truncate(p.postal_address_postal_code, 20),
    direccion_completa: p.postal_address_formatted_address || null,
    direccion_custom: p[CF.dir] || null,
    direccion_custom_ciudad: truncate(p[`${CF.dir}_locality`], 255),
    direccion_custom_estado: truncate(p[`${CF.dir}_admin_area_level_1`], 255),
    direccion_custom_pais: truncate(p[`${CF.dir}_country`], 255),
    direccion_custom_codigo_postal: truncate(p[`${CF.dir}_postal_code`], 20),
    direccion_custom_completa: p[`${CF.dir}_formatted_address`] || null,
    division_filial_area: p[CF.division_filial] || null,
    tipo_contacto: truncate(p[CF.tipo_contacto], 100),
    tipo_reservas: p[CF.tipo_reservas] || null,
    potencial_mensual_cn: p[CF.potencial_mensual] || null,
    cumpleanos: safeDate(p[CF.cumpleanos]),
    afiliado_fidelizacion: p[CF.afiliado_fidelizacion] || null,
    whatsapp_chat_link: truncate(p[CF.whatsapp_link], 500),
    tratos_abiertos: p.open_deals_count || 0,
    tratos_cerrados: p.closed_deals_count || 0,
    tratos_ganados: p.won_deals_count || 0,
    tratos_perdidos: p.lost_deals_count || 0,
    actividades_total: p.activities_count || 0,
    actividades_completadas: p.done_activities_count || 0,
    actividades_pendientes: p.undone_activities_count || 0,
    emails_count: p.email_messages_count || 0,
    marketing_status: truncate(p.marketing_status, 50),
    etiqueta: truncate(p.label, 100),
    etiqueta_ids: p.label_ids || [],
    notas: p.notes || null,
    foto_id: typeof p.picture_id === "object" ? p.picture_id?.value || null : p.picture_id || null,
    visible_para: p.visible_to ? parseInt(p.visible_to) : null,
    fecha_proxima_actividad: safeDate(p.next_activity_date),
    fecha_ultima_actividad: safeDate(p.last_activity_date),
    ultimo_email_recibido: p.last_incoming_mail_time || null,
    ultimo_email_enviado: p.last_outgoing_mail_time || null,
    activo: p.active_flag ?? true,
    pipedrive_add_time: p.add_time || null,
    pipedrive_update_time: p.update_time || null,
    pipedrive_delete_time: p.delete_time || null,
    pipedrive_company_id: p.company_id || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

/* ==================================================
  Extraer UN lote de persons desde Pipedrive
  Usa upsert con pipedrive_id como clave única:
  - Si no existe → inserta
  - Si ya existe → omite (ignoreDuplicates)
  No necesita pre-cargar IDs existentes.
================================================== */
export async function extraerLotePersons(
  start: number,
): Promise<LoteResultado> {
  try {
    const limit = 100
    const url = `${PIPEDRIVE_BASE_URL}/persons?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}&sort=add_time DESC`
    const response = await fetch(url)
    const json = await response.json()

    if (!json.success || !json.data) {
      return {
        success: true,
        insertados: 0,
        omitidos: 0,
        errores: 0,
        erroresDetalle: [],
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    // Obtener los pipedrive_id del lote
    const pipedriveIds = json.data.map((p: any) => p.id)

    // Consultar cuáles ya existen en Supabase
    const { data: existentes } = await supabase
      .from("pip_persons")
      .select("pipedrive_id")
      .in("pipedrive_id", pipedriveIds)

    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))

    // Filtrar solo los nuevos
    const nuevos = json.data.filter((p: any) => !existentesSet.has(p.id))
    const omitidos = json.data.length - nuevos.length

    let insertados = 0
    let errores = 0
    const erroresDetalle: ErrorDetalle[] = []

    for (const person of nuevos) {
      const row = mapPersonToRow(person)
      const { error } = await supabase.from("pip_persons").insert(row)

      if (error) {
        errores++
        erroresDetalle.push({
          pipedrive_id: person.id,
          nombre: person.name || "",
          error: error.message,
        })
      } else {
        insertados++
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
      erroresDetalle,
      total_lote: json.data.length,
      hay_mas: hayMas,
      next_start: nextStart,
      mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores`,
    }
  } catch (error: any) {
    return {
      success: false,
      insertados: 0,
      omitidos: 0,
      errores: 1,
      erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }],
      total_lote: 0,
      hay_mas: false,
      next_start: start,
      mensaje: `Error: ${error.message}`,
    }
  }
}

/* ==================================================
  Verificar conexión a Pipedrive y obtener indicador de total
  Pipedrive no expone un conteo directo. Iterarlo todo tarda
  demasiado (+200k registros), así que solo verificamos que
  la API responda y retornamos -1 si hay datos (indicando "desconocido").
================================================== */
export async function verificarPipedrive(): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/persons?api_token=${PIPEDRIVE_API_TOKEN}&start=0&limit=1`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()

    return {
      conectado: json.success === true,
      hayDatos: json.data && json.data.length > 0,
    }
  } catch {
    return { conectado: false, hayDatos: false }
  }
}

/* ==================================================
  Conteo total de Persons en Pipedrive (sin recorrer)
================================================== */
export async function conteoPipedrive(): Promise<number> {
  try {
    let start = 0
    let total = 0
    while (true) {
      const url = `${PIPEDRIVE_BASE_URL}/persons?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=500`
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
      const json = await response.json()
      if (!json.success || !json.data) break
      total += json.data.length
      if (!json.additional_data?.pagination?.more_items_in_collection) break
      start = json.additional_data.pagination.next_start
    }
    return total
  } catch {
    return 0
  }
}

/* ==================================================
  Obtener persons de Supabase con paginación
================================================== */
export async function obtenerPersonsSupabase(
  pagina: number = 1,
  porPagina: number = 20,
  busqueda: string = "",
): Promise<{ data: PersonRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina
  const hasta = desde + porPagina - 1

  let query = supabase
    .from("pip_persons")
    .select(
      "id, pipedrive_id, nombre, primer_nombre, apellidos, puesto, email, telefono, organizacion_nombre, propietario_nombre, activo, pipedrive_add_time, fechaactualizacion",
      { count: "exact" },
    )

  if (busqueda) {
    const isNumeric = /^\d+$/.test(busqueda.trim())
    if (isNumeric) {
      query = query.or(`id.eq.${busqueda.trim()},pipedrive_id.eq.${busqueda.trim()},nombre.ilike.%${busqueda}%`)
    } else {
      query = query.or(`nombre.ilike.%${busqueda}%,organizacion_nombre.ilike.%${busqueda}%,puesto.ilike.%${busqueda}%`)
    }
  }

  query = query.order("pipedrive_id", { ascending: true }).range(desde, hasta)

  const { data, count, error } = await query

  if (error) {
    console.error("Error obteniendo persons:", error.message)
    return { data: [], total: 0 }
  }

  return { data: (data as PersonRow[]) || [], total: count || 0 }
}

/* ==================================================
  Conteo de persons en Supabase
================================================== */
export async function conteoPersonsSupabase(): Promise<number> {
  const { count } = await supabase
    .from("pip_persons")
    .select("*", { count: "exact", head: true })

  return count || 0
}

/* ==================================================
  ORGANIZATIONS — Tipos
================================================== */
export type OrganizationRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  propietario_nombre: string | null
  direccion_ciudad: string | null
  direccion_pais: string | null
  personas_count: number
  tratos_abiertos: number
  tratos_ganados: number
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

/* ==================================================
  Mapear organization de Pipedrive → row Supabase
================================================== */
function mapOrganizationToRow(o: any) {
  return {
    pipedrive_id: o.id,
    nombre: truncate(o.name, 255),
    primer_caracter: truncate(o.first_char, 5),
    propietario_id: typeof o.owner_id === "object" ? o.owner_id?.id : o.owner_id || null,
    propietario_nombre: truncate(typeof o.owner_id === "object" ? o.owner_id?.name : o.owner_name, 255),
    direccion: o.address || null,
    direccion_subpremise: truncate(o.address_subpremise, 100),
    direccion_numero_casa: truncate(o.address_street_number, 50),
    direccion_calle: truncate(o.address_route, 255),
    direccion_sublocalidad: truncate(o.address_sublocality, 255),
    direccion_ciudad: truncate(o.address_locality, 255),
    direccion_estado: truncate(o.address_admin_area_level_1, 255),
    direccion_region: truncate(o.address_admin_area_level_2, 255),
    direccion_pais: truncate(o.address_country, 255),
    direccion_codigo_postal: truncate(o.address_postal_code, 20),
    direccion_completa: o.address_formatted_address || null,
    cc_email: truncate(o.cc_email, 255),
    personas_count: o.people_count || 0,
    tratos_abiertos: o.open_deals_count || 0,
    tratos_abiertos_relacionados: o.related_open_deals_count || 0,
    tratos_cerrados: o.closed_deals_count || 0,
    tratos_cerrados_relacionados: o.related_closed_deals_count || 0,
    tratos_ganados: o.won_deals_count || 0,
    tratos_ganados_relacionados: o.related_won_deals_count || 0,
    tratos_perdidos: o.lost_deals_count || 0,
    tratos_perdidos_relacionados: o.related_lost_deals_count || 0,
    actividades_total: o.activities_count || 0,
    actividades_completadas: o.done_activities_count || 0,
    actividades_pendientes: o.undone_activities_count || 0,
    emails_count: o.email_messages_count || 0,
    archivos_count: o.files_count || 0,
    notas_count: o.notes_count || 0,
    seguidores_count: o.followers_count || 0,
    etiqueta: o.label || null,
    etiqueta_ids: o.label_ids || [],
    visible_para: o.visible_to ? parseInt(o.visible_to) : null,
    fecha_proxima_actividad: safeDate(o.next_activity_date),
    fecha_ultima_actividad: safeDate(o.last_activity_date),
    proxima_actividad_id: o.next_activity_id || null,
    ultima_actividad_id: o.last_activity_id || null,
    activo: o.active_flag ?? true,
    pipedrive_add_time: o.add_time || null,
    pipedrive_update_time: o.update_time || null,
    pipedrive_delete_time: o.delete_time || null,
    pipedrive_company_id: o.company_id || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

/* ==================================================
  Extraer UN lote de organizations desde Pipedrive
================================================== */
export async function extraerLoteOrganizations(
  start: number,
): Promise<LoteResultado> {
  try {
    const limit = 100
    const url = `${PIPEDRIVE_BASE_URL}/organizations?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}`
    const response = await fetch(url)
    const json = await response.json()

    if (!json.success || !json.data) {
      return {
        success: true,
        insertados: 0,
        omitidos: 0,
        errores: 0,
        erroresDetalle: [],
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    const pipedriveIds = json.data.map((o: any) => o.id)
    const { data: existentes } = await supabase
      .from("pip_organizations")
      .select("pipedrive_id")
      .in("pipedrive_id", pipedriveIds)
    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))
    const nuevos = json.data.filter((o: any) => !existentesSet.has(o.id))
    const omitidos = json.data.length - nuevos.length

    let insertados = 0
    let errores = 0
    const erroresDetalle: ErrorDetalle[] = []

    for (const org of nuevos) {
      const row = mapOrganizationToRow(org)
      const { error } = await supabase.from("pip_organizations").insert(row)
      if (error) {
        errores++
        erroresDetalle.push({ pipedrive_id: org.id, nombre: org.name || "", error: error.message })
      } else {
        insertados++
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
      erroresDetalle,
      total_lote: json.data.length,
      hay_mas: hayMas,
      next_start: nextStart,
      mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores`,
    }
  } catch (error: any) {
    return {
      success: false,
      insertados: 0,
      omitidos: 0,
      errores: 1,
      erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }],
      total_lote: 0,
      hay_mas: false,
      next_start: start,
      mensaje: `Error: ${error.message}`,
    }
  }
}

/* ==================================================
  Verificar conexión a Pipedrive para Organizations
================================================== */
export async function verificarPipedriveOrganizations(): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/organizations?api_token=${PIPEDRIVE_API_TOKEN}&start=0&limit=1`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()

    return {
      conectado: json.success === true,
      hayDatos: json.data && json.data.length > 0,
    }
  } catch {
    return { conectado: false, hayDatos: false }
  }
}

/* ==================================================
  Obtener organizations de Supabase con paginación
================================================== */
export async function obtenerOrganizationsSupabase(
  pagina: number = 1,
  porPagina: number = 20,
  busqueda: string = "",
): Promise<{ data: OrganizationRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina
  const hasta = desde + porPagina - 1

  let query = supabase
    .from("pip_organizations")
    .select(
      "id, pipedrive_id, nombre, propietario_nombre, direccion_ciudad, direccion_pais, personas_count, tratos_abiertos, tratos_ganados, activo, pipedrive_add_time, fechaactualizacion",
      { count: "exact" },
    )

  if (busqueda) {
    query = query.or(`nombre.ilike.%${busqueda}%,direccion_ciudad.ilike.%${busqueda}%`)
  }

  query = query.order("pipedrive_id", { ascending: true }).range(desde, hasta)

  const { data, count, error } = await query

  if (error) {
    console.error("Error obteniendo organizations:", error.message)
    return { data: [], total: 0 }
  }

  return { data: (data as OrganizationRow[]) || [], total: count || 0 }
}

/* ==================================================
  Conteo de organizations en Supabase
================================================== */
export async function conteoOrganizationsSupabase(): Promise<number> {
  const { count } = await supabase
    .from("pip_organizations")
    .select("*", { count: "exact", head: true })

  return count || 0
}

/* ==================================================
  ACTIVITIES — Tipos
================================================== */
export type ActivityRow = {
  id: number
  pipedrive_id: number
  asunto: string | null
  tipo: string | null
  persona_id: number | null
  organizacion_id: number | null
  trato_id: number | null
  fecha_vencimiento: string | null
  hora_vencimiento: string | null
  duracion: string | null
  completado: boolean
  propietario_id: number | null
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

/* ==================================================
  Mapear activity de Pipedrive → row Supabase
================================================== */
function mapActivityToRow(a: any) {
  const loc = typeof a.location === "object" ? a.location : null
  return {
    pipedrive_id: a.id,
    asunto: truncate(a.subject, 500),
    tipo: truncate(a.type, 100),
    nota: a.note || null,
    descripcion_publica: a.public_description || null,
    prioridad: a.priority || null,
    trato_id: a.deal_id || null,
    lead_id: truncate(a.lead_id, 255),
    persona_id: a.person_id || null,
    organizacion_id: a.org_id || null,
    proyecto_id: a.project_id || null,
    propietario_id: a.user_id || a.owner_id || null,
    creador_id: a.creator_user_id || null,
    fecha_vencimiento: safeDate(a.due_date),
    hora_vencimiento: truncate(a.due_time, 10),
    duracion: truncate(a.duration, 10),
    completado: a.done === true || a.done === 1,
    fecha_completado: a.marked_as_done_time || null,
    ubicacion: loc ? loc.value : (typeof a.location === "string" ? a.location : null),
    ubicacion_pais: truncate(loc?.country, 255),
    ubicacion_estado: truncate(loc?.admin_area_level_1, 255),
    ubicacion_region: truncate(loc?.admin_area_level_2, 255),
    ubicacion_ciudad: truncate(loc?.locality, 255),
    ubicacion_sublocalidad: truncate(loc?.sublocality, 255),
    ubicacion_calle: truncate(loc?.route, 255),
    ubicacion_numero_casa: truncate(loc?.street_number, 50),
    ubicacion_subpremise: truncate(loc?.subpremise, 100),
    ubicacion_codigo_postal: truncate(loc?.postal_code, 20),
    participantes: a.participants || [],
    asistentes: a.attendees || [],
    conferencia_cliente: truncate(a.conference_meeting_client, 255),
    conferencia_url: a.conference_meeting_url || null,
    conferencia_id: truncate(a.conference_meeting_id, 255),
    ocupado: a.busy_flag ?? false,
    activo: a.active_flag ?? true,
    pipedrive_add_time: a.add_time || null,
    pipedrive_update_time: a.update_time || null,
    pipedrive_company_id: a.company_id || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

/* ==================================================
  Extraer UN lote de activities desde Pipedrive
================================================== */
export async function extraerLoteActivities(
  start: number,
): Promise<LoteResultado> {
  try {
    const limit = 500
    const url = `${PIPEDRIVE_BASE_URL}/activities?api_token=${PIPEDRIVE_API_TOKEN}&user_id=0&start=${start}&limit=${limit}`
    const response = await fetch(url)
    const json = await response.json()

    if (!json.success || !json.data) {
      return {
        success: true,
        insertados: 0,
        omitidos: 0,
        errores: 0,
        erroresDetalle: [],
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    const pipedriveIds = json.data.map((a: any) => a.id)
    const { data: existentes } = await supabase
      .from("pip_activities")
      .select("pipedrive_id")
      .in("pipedrive_id", pipedriveIds)
    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))
    const nuevos = json.data.filter((a: any) => !existentesSet.has(a.id))
    const omitidos = json.data.length - nuevos.length

    let insertados = 0
    let errores = 0
    const erroresDetalle: ErrorDetalle[] = []

    for (const activity of nuevos) {
      const row = mapActivityToRow(activity)
      const { error } = await supabase.from("pip_activities").insert(row)
      if (error) {
        errores++
        erroresDetalle.push({ pipedrive_id: activity.id, nombre: activity.subject || "", error: error.message })
      } else {
        insertados++
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
      erroresDetalle,
      total_lote: json.data.length,
      hay_mas: hayMas,
      next_start: nextStart,
      mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores`,
    }
  } catch (error: any) {
    return {
      success: false,
      insertados: 0,
      omitidos: 0,
      errores: 1,
      erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }],
      total_lote: 0,
      hay_mas: false,
      next_start: start,
      mensaje: `Error: ${error.message}`,
    }
  }
}

/* ==================================================
  Verificar conexión a Pipedrive para Activities
================================================== */
export async function verificarPipedriveActivities(): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/activities?api_token=${PIPEDRIVE_API_TOKEN}&user_id=0&start=0&limit=1`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()

    return {
      conectado: json.success === true,
      hayDatos: json.data && json.data.length > 0,
    }
  } catch {
    return { conectado: false, hayDatos: false }
  }
}

/* ==================================================
  Obtener activities de Supabase con paginación
================================================== */
export async function obtenerActivitiesSupabase(
  pagina: number = 1,
  porPagina: number = 20,
  busqueda: string = "",
): Promise<{ data: ActivityRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina
  const hasta = desde + porPagina - 1

  let query = supabase
    .from("pip_activities")
    .select(
      "id, pipedrive_id, asunto, tipo, persona_id, organizacion_id, trato_id, fecha_vencimiento, hora_vencimiento, duracion, completado, propietario_id, pipedrive_add_time, fechaactualizacion",
      { count: "exact" },
    )

  if (busqueda) {
    query = query.or(`asunto.ilike.%${busqueda}%,tipo.ilike.%${busqueda}%`)
  }

  query = query.order("pipedrive_id", { ascending: false }).range(desde, hasta)

  const { data, count, error } = await query

  if (error) {
    console.error("Error obteniendo activities:", error.message)
    return { data: [], total: 0 }
  }

  return { data: (data as ActivityRow[]) || [], total: count || 0 }
}

/* ==================================================
  Conteo de activities en Supabase
================================================== */
export async function conteoActivitiesSupabase(): Promise<number> {
  const { count } = await supabase
    .from("pip_activities")
    .select("*", { count: "exact", head: true })

  return count || 0
}

/* ==================================================
  TASKS — Tipos
================================================== */
export type TaskRow = {
  id: number
  pipedrive_id: number
  titulo: string | null
  descripcion: string | null
  proyecto_id: number | null
  tarea_padre_id: number | null
  asignado_id: number | null
  creador_id: number | null
  completado: boolean
  fecha_vencimiento: string | null
  fecha_completado: string | null
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

/* ==================================================
  Mapear task de Pipedrive → row Supabase
================================================== */
function mapTaskToRow(t: any) {
  return {
    pipedrive_id: t.id,
    titulo: truncate(t.title, 500),
    descripcion: t.description || null,
    proyecto_id: t.project_id || null,
    tarea_padre_id: t.parent_task_id || null,
    asignado_id: t.assignee_id || null,
    asignado_ids: t.assignee_ids || [],
    creador_id: t.creator_id || null,
    completado: t.done === 1 || t.done === true,
    fecha_completado: t.marked_as_done_time || null,
    fecha_vencimiento: safeDate(t.due_date),
    pipedrive_add_time: t.add_time || null,
    pipedrive_update_time: t.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

/* ==================================================
  Extraer UN lote de tasks desde Pipedrive
================================================== */
export async function extraerLoteTasks(
  start: number,
): Promise<LoteResultado> {
  try {
    const limit = 100
    const url = `${PIPEDRIVE_BASE_URL}/tasks?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}`
    const response = await fetch(url)
    const json = await response.json()

    if (!json.success || !json.data) {
      return {
        success: true,
        insertados: 0,
        omitidos: 0,
        errores: 0,
        erroresDetalle: [],
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    const pipedriveIds = json.data.map((t: any) => t.id)
    const { data: existentes } = await supabase
      .from("pip_tasks")
      .select("pipedrive_id")
      .in("pipedrive_id", pipedriveIds)
    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))
    const nuevos = json.data.filter((t: any) => !existentesSet.has(t.id))
    const omitidos = json.data.length - nuevos.length

    let insertados = 0
    let errores = 0
    const erroresDetalle: ErrorDetalle[] = []

    for (const task of nuevos) {
      const row = mapTaskToRow(task)
      const { error } = await supabase.from("pip_tasks").insert(row)
      if (error) {
        errores++
        erroresDetalle.push({ pipedrive_id: task.id, nombre: task.title || "", error: error.message })
      } else {
        insertados++
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
      erroresDetalle,
      total_lote: json.data.length,
      hay_mas: hayMas,
      next_start: nextStart,
      mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores`,
    }
  } catch (error: any) {
    return {
      success: false,
      insertados: 0,
      omitidos: 0,
      errores: 1,
      erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }],
      total_lote: 0,
      hay_mas: false,
      next_start: start,
      mensaje: `Error: ${error.message}`,
    }
  }
}

/* ==================================================
  Verificar conexión a Pipedrive para Tasks
================================================== */
export async function verificarPipedriveTasks(): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/tasks?api_token=${PIPEDRIVE_API_TOKEN}&start=0&limit=1`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()

    return {
      conectado: json.success === true,
      hayDatos: json.data && json.data.length > 0,
    }
  } catch {
    return { conectado: false, hayDatos: false }
  }
}

/* ==================================================
  Obtener tasks de Supabase con paginación
================================================== */
export async function obtenerTasksSupabase(
  pagina: number = 1,
  porPagina: number = 20,
  busqueda: string = "",
): Promise<{ data: TaskRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina
  const hasta = desde + porPagina - 1

  let query = supabase
    .from("pip_tasks")
    .select(
      "id, pipedrive_id, titulo, descripcion, proyecto_id, tarea_padre_id, asignado_id, creador_id, completado, fecha_vencimiento, fecha_completado, pipedrive_add_time, fechaactualizacion",
      { count: "exact" },
    )

  if (busqueda) {
    query = query.or(`titulo.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`)
  }

  query = query.order("pipedrive_id", { ascending: false }).range(desde, hasta)

  const { data, count, error } = await query

  if (error) {
    console.error("Error obteniendo tasks:", error.message)
    return { data: [], total: 0 }
  }

  return { data: (data as TaskRow[]) || [], total: count || 0 }
}

/* ==================================================
  Conteo de tasks en Supabase
================================================== */
export async function conteoTasksSupabase(): Promise<number> {
  const { count } = await supabase
    .from("pip_tasks")
    .select("*", { count: "exact", head: true })

  return count || 0
}

/* ==================================================
  NOTES — Tipos
================================================== */
export type NoteRow = {
  id: number
  pipedrive_id: number
  contenido: string | null
  trato_id: number | null
  trato_titulo: string | null
  persona_id: number | null
  persona_nombre: string | null
  organizacion_id: number | null
  organizacion_nombre: string | null
  usuario_id: number | null
  usuario_nombre: string | null
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

/* ==================================================
  Mapear note de Pipedrive → row Supabase
================================================== */
function mapNoteToRow(n: any) {
  return {
    pipedrive_id: n.id,
    contenido: n.content || null,
    trato_id: n.deal_id || null,
    trato_titulo: truncate(typeof n.deal === "object" ? n.deal?.title : null, 255),
    lead_id: truncate(n.lead_id, 255),
    persona_id: n.person_id || null,
    persona_nombre: truncate(typeof n.person === "object" ? n.person?.name : null, 255),
    organizacion_id: n.org_id || null,
    organizacion_nombre: truncate(typeof n.organization === "object" ? n.organization?.name : null, 255),
    proyecto_id: n.project_id || null,
    proyecto_titulo: truncate(typeof n.project === "object" ? n.project?.title : null, 255),
    usuario_id: n.user_id || null,
    usuario_nombre: truncate(typeof n.user === "object" ? n.user?.name : null, 255),
    usuario_email: truncate(typeof n.user === "object" ? n.user?.email : null, 255),
    ultimo_editor_id: n.last_update_user_id || null,
    fijado_trato: n.pinned_to_deal_flag === true || n.pinned_to_deal_flag === 1,
    fijado_organizacion: n.pinned_to_organization_flag === true || n.pinned_to_organization_flag === 1,
    fijado_persona: n.pinned_to_person_flag === true || n.pinned_to_person_flag === 1,
    fijado_proyecto: n.pinned_to_project_flag === true || n.pinned_to_project_flag === 1,
    fijado_lead: n.pinned_to_lead_flag === true || n.pinned_to_lead_flag === 1,
    activo: n.active_flag ?? true,
    pipedrive_add_time: n.add_time || null,
    pipedrive_update_time: n.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

/* ==================================================
  Extraer UN lote de notes desde Pipedrive
================================================== */
export async function extraerLoteNotes(
  start: number,
): Promise<LoteResultado> {
  try {
    const limit = 100
    const url = `${PIPEDRIVE_BASE_URL}/notes?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}`
    const response = await fetch(url)
    const json = await response.json()

    if (!json.success || !json.data) {
      return {
        success: true,
        insertados: 0,
        omitidos: 0,
        errores: 0,
        erroresDetalle: [],
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    const pipedriveIds = json.data.map((n: any) => n.id)
    const { data: existentes } = await supabase
      .from("pip_notes")
      .select("pipedrive_id")
      .in("pipedrive_id", pipedriveIds)
    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))
    const nuevos = json.data.filter((n: any) => !existentesSet.has(n.id))
    const omitidos = json.data.length - nuevos.length

    let insertados = 0
    let errores = 0
    const erroresDetalle: ErrorDetalle[] = []

    for (const note of nuevos) {
      const row = mapNoteToRow(note)
      const { error } = await supabase.from("pip_notes").insert(row)
      if (error) {
        errores++
        const nombre = (typeof note.person === "object" ? note.person?.name : null) || ""
        erroresDetalle.push({ pipedrive_id: note.id, nombre, error: error.message })
      } else {
        insertados++
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
      erroresDetalle,
      total_lote: json.data.length,
      hay_mas: hayMas,
      next_start: nextStart,
      mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores`,
    }
  } catch (error: any) {
    return {
      success: false,
      insertados: 0,
      omitidos: 0,
      errores: 1,
      erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }],
      total_lote: 0,
      hay_mas: false,
      next_start: start,
      mensaje: `Error: ${error.message}`,
    }
  }
}

/* ==================================================
  Verificar conexión a Pipedrive para Notes
================================================== */
export async function verificarPipedriveNotes(): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/notes?api_token=${PIPEDRIVE_API_TOKEN}&start=0&limit=1`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()

    return {
      conectado: json.success === true,
      hayDatos: json.data && json.data.length > 0,
    }
  } catch {
    return { conectado: false, hayDatos: false }
  }
}

/* ==================================================
  Obtener notes de Supabase con paginación
================================================== */
export async function obtenerNotesSupabase(
  pagina: number = 1,
  porPagina: number = 20,
  busqueda: string = "",
): Promise<{ data: NoteRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina
  const hasta = desde + porPagina - 1

  let query = supabase
    .from("pip_notes")
    .select(
      "id, pipedrive_id, contenido, trato_id, trato_titulo, persona_id, persona_nombre, organizacion_id, organizacion_nombre, usuario_id, usuario_nombre, activo, pipedrive_add_time, fechaactualizacion",
      { count: "exact" },
    )

  if (busqueda) {
    query = query.or(`contenido.ilike.%${busqueda}%,persona_nombre.ilike.%${busqueda}%,organizacion_nombre.ilike.%${busqueda}%`)
  }

  query = query.order("pipedrive_id", { ascending: false }).range(desde, hasta)

  const { data, count, error } = await query

  if (error) {
    console.error("Error obteniendo notes:", error.message)
    return { data: [], total: 0 }
  }

  return { data: (data as NoteRow[]) || [], total: count || 0 }
}

/* ==================================================
  Conteo de notes en Supabase
================================================== */
export async function conteoNotesSupabase(): Promise<number> {
  const { count } = await supabase
    .from("pip_notes")
    .select("*", { count: "exact", head: true })

  return count || 0
}

/* ==================================================
  Conteos totales en Pipedrive (iteran páginas)
================================================== */
async function conteoTotalPipedrive(endpoint: string): Promise<number> {
  try {
    let start = 0
    let total = 0
    while (true) {
      const url = `${PIPEDRIVE_BASE_URL}/${endpoint}?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=500`
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
      const json = await response.json()
      if (!json.success || !json.data) break
      total += json.data.length
      if (!json.additional_data?.pagination?.more_items_in_collection) break
      start = json.additional_data.pagination.next_start
    }
    return total
  } catch {
    return 0
  }
}

export async function conteoPipedriveOrganizations(): Promise<number> {
  return conteoTotalPipedrive("organizations")
}
export async function conteoPipedriveActivities(): Promise<number> {
  // Activities requiere user_id=0 para traer las de TODOS los usuarios
  try {
    let start = 0
    let total = 0
    while (true) {
      const url = `${PIPEDRIVE_BASE_URL}/activities?api_token=${PIPEDRIVE_API_TOKEN}&user_id=0&start=${start}&limit=500`
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
      const json = await response.json()
      if (!json.success || !json.data) break
      total += json.data.length
      if (!json.additional_data?.pagination?.more_items_in_collection) break
      start = json.additional_data.pagination.next_start
    }
    return total
  } catch {
    return 0
  }
}
export async function conteoPipedriveTasks(): Promise<number> {
  return conteoTotalPipedrive("tasks")
}
export async function conteoPipedriveNotes(): Promise<number> {
  return conteoTotalPipedrive("notes")
}
export async function conteoPipedriveUsers(): Promise<number> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/users?api_token=${PIPEDRIVE_API_TOKEN}`
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    const json = await response.json()
    if (!json.success || !json.data) return 0
    return json.data.length
  } catch {
    return 0
  }
}

/* ==================================================
  USERS — Tipos
================================================== */
export type UserRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  email: string | null
  telefono: string | null
  admin: boolean
  activo: boolean
  rol_id: number | null
  zona_horaria: string | null
  idioma: string | null
  ultima_conexion: string | null
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

/* ==================================================
  Mapear user de Pipedrive → row Supabase
================================================== */
function mapUserToRow(u: any) {
  return {
    pipedrive_id: u.id,
    nombre: truncate(u.name, 255),
    email: truncate(u.email, 255),
    telefono: truncate(u.phone, 50),
    admin: u.is_admin === true || u.is_admin === 1,
    activo: u.active_flag ?? true,
    rol_id: u.role_id || null,
    zona_horaria: truncate(u.timezone_name, 100),
    zona_horaria_offset: truncate(u.timezone_offset, 20),
    idioma: truncate(u.locale, 50),
    lang: truncate(u.lang, 20),
    moneda_default: truncate(u.default_currency, 10),
    icono_url: u.icon_url || null,
    ultima_conexion: u.last_login || null,
    ha_creado_empresa: u.has_created_company === true || u.has_created_company === 1,
    accesos: u.access || [],
    pipedrive_add_time: u.created || null,
    pipedrive_update_time: u.modified || null,
    pipedrive_company_id: u.company_id || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

/* ==================================================
  Extraer users desde Pipedrive
  (Users no tiene paginación: se trae todo en una llamada)
================================================== */
export async function extraerLoteUsers(
  start: number,
): Promise<LoteResultado> {
  try {
    // Users endpoint no usa paginación estándar; se trae todo
    if (start > 0) {
      return {
        success: true,
        insertados: 0,
        omitidos: 0,
        errores: 0,
        erroresDetalle: [],
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    const url = `${PIPEDRIVE_BASE_URL}/users?api_token=${PIPEDRIVE_API_TOKEN}`
    const response = await fetch(url)
    const json = await response.json()

    if (!json.success || !json.data) {
      return {
        success: true,
        insertados: 0,
        omitidos: 0,
        errores: 0,
        erroresDetalle: [],
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    const pipedriveIds = json.data.map((u: any) => u.id)
    const { data: existentes } = await supabase
      .from("pip_users")
      .select("pipedrive_id")
      .in("pipedrive_id", pipedriveIds)
    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))
    const nuevos = json.data.filter((u: any) => !existentesSet.has(u.id))
    const omitidos = json.data.length - nuevos.length

    let insertados = 0
    let errores = 0
    const erroresDetalle: ErrorDetalle[] = []

    for (const user of nuevos) {
      const row = mapUserToRow(user)
      const { error } = await supabase.from("pip_users").insert(row)
      if (error) {
        errores++
        erroresDetalle.push({ pipedrive_id: user.id, nombre: user.name || "", error: error.message })
      } else {
        insertados++
      }
    }

    return {
      success: true,
      insertados,
      omitidos,
      errores,
      erroresDetalle,
      total_lote: json.data.length,
      hay_mas: false,
      next_start: json.data.length,
      mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores`,
    }
  } catch (error: any) {
    return {
      success: false,
      insertados: 0,
      omitidos: 0,
      errores: 1,
      erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }],
      total_lote: 0,
      hay_mas: false,
      next_start: start,
      mensaje: `Error: ${error.message}`,
    }
  }
}

/* ==================================================
  Verificar conexión a Pipedrive para Users
================================================== */
export async function verificarPipedriveUsers(): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/users?api_token=${PIPEDRIVE_API_TOKEN}`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()
    return {
      conectado: json.success === true,
      hayDatos: json.data && json.data.length > 0,
    }
  } catch {
    return { conectado: false, hayDatos: false }
  }
}

/* ==================================================
  Obtener users de Supabase con paginación
================================================== */
export async function obtenerUsersSupabase(
  pagina: number = 1,
  porPagina: number = 20,
  busqueda: string = "",
): Promise<{ data: UserRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina
  const hasta = desde + porPagina - 1

  let query = supabase
    .from("pip_users")
    .select(
      "id, pipedrive_id, nombre, email, telefono, admin, activo, rol_id, zona_horaria, idioma, ultima_conexion, pipedrive_add_time, fechaactualizacion",
      { count: "exact" },
    )

  if (busqueda) {
    query = query.or(`nombre.ilike.%${busqueda}%,email.ilike.%${busqueda}%`)
  }

  query = query.order("pipedrive_id", { ascending: true }).range(desde, hasta)

  const { data, count, error } = await query
  if (error) {
    console.error("Error obteniendo users:", error.message)
    return { data: [], total: 0 }
  }
  return { data: (data as UserRow[]) || [], total: count || 0 }
}

/* ==================================================
  Conteo de users en Supabase
================================================== */
export async function conteoUsersSupabase(): Promise<number> {
  const { count } = await supabase
    .from("pip_users")
    .select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  ============================================================
  DEALS
  ============================================================
================================================== */
export type DealRow = {
  id: number
  pipedrive_id: number
  titulo: string | null
  valor: number | null
  moneda: string | null
  estado: string | null
  etapa_id: number | null
  pipeline_id: number | null
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapDealToRow(d: any) {
  return {
    pipedrive_id: d.id,
    titulo: truncate(d.title, 500),
    valor: typeof d.value === "number" ? d.value : (d.value ? Number(d.value) : null),
    moneda: truncate(d.currency, 10),
    estado: truncate(d.status, 50),
    etapa_id: d.stage_id || null,
    pipeline_id: d.pipeline_id || null,
    persona_id: typeof d.person_id === "object" ? d.person_id?.value : d.person_id || null,
    organizacion_id: typeof d.org_id === "object" ? d.org_id?.value : d.org_id || null,
    propietario_id: typeof d.user_id === "object" ? d.user_id?.id : d.user_id || null,
    creador_id: typeof d.creator_user_id === "object" ? d.creator_user_id?.id : d.creator_user_id || null,
    fecha_cierre: d.close_time || null,
    won_time: d.won_time || null,
    lost_time: d.lost_time || null,
    expected_close_date: safeDate(d.expected_close_date),
    stage_change_time: d.stage_change_time || null,
    probabilidad: d.probability ?? null,
    razon_perdida: d.lost_reason || null,
    activo: d.active ?? true,
    eliminado: d.deleted ?? false,
    products_count: d.products_count || 0,
    files_count: d.files_count || 0,
    notes_count: d.notes_count || 0,
    followers_count: d.followers_count || 0,
    email_messages_count: d.email_messages_count || 0,
    activities_count: d.activities_count || 0,
    done_activities_count: d.done_activities_count || 0,
    undone_activities_count: d.undone_activities_count || 0,
    etiqueta: truncate(d.label, 100),
    visible_para: d.visible_to ? parseInt(d.visible_to) : null,
    pipedrive_add_time: d.add_time || null,
    pipedrive_update_time: d.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteDeals(start: number): Promise<LoteResultado> {
  try {
    const limit = 100
    const url = `${PIPEDRIVE_BASE_URL}/deals?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}`
    const response = await fetch(url)
    const json = await response.json()
    if (!json.success || !json.data) {
      return { success: true, insertados: 0, omitidos: 0, errores: 0, erroresDetalle: [], total_lote: 0, hay_mas: false, next_start: start, mensaje: "No hay más datos en Pipedrive" }
    }
    const pipedriveIds = json.data.map((x: any) => x.id)
    const { data: existentes } = await supabase.from("pip_deals").select("pipedrive_id").in("pipedrive_id", pipedriveIds)
    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))
    const nuevos = json.data.filter((x: any) => !existentesSet.has(x.id))
    const omitidos = json.data.length - nuevos.length
    let insertados = 0, errores = 0
    const erroresDetalle: ErrorDetalle[] = []
    for (const item of nuevos) {
      const { error } = await supabase.from("pip_deals").insert(mapDealToRow(item))
      if (error) { errores++; erroresDetalle.push({ pipedrive_id: item.id, nombre: item.title || "", error: error.message }) }
      else insertados++
    }
    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit
    return { success: true, insertados, omitidos, errores, erroresDetalle, total_lote: json.data.length, hay_mas: hayMas, next_start: nextStart, mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores` }
  } catch (error: any) {
    return { success: false, insertados: 0, omitidos: 0, errores: 1, erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }], total_lote: 0, hay_mas: false, next_start: start, mensaje: `Error: ${error.message}` }
  }
}

export async function verificarPipedriveDeals(): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/deals?api_token=${PIPEDRIVE_API_TOKEN}&start=0&limit=1`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()
    return { conectado: json.success === true, hayDatos: json.data && json.data.length > 0 }
  } catch { return { conectado: false, hayDatos: false } }
}

export async function obtenerDealsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: DealRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina
  const hasta = desde + porPagina - 1
  let query = supabase.from("pip_deals").select("id, pipedrive_id, titulo, valor, moneda, estado, etapa_id, pipeline_id, activo, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`titulo.ilike.%${busqueda}%,estado.ilike.%${busqueda}%`)
  query = query.order("pipedrive_id", { ascending: false }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo deals:", error.message); return { data: [], total: 0 } }
  return { data: (data as DealRow[]) || [], total: count || 0 }
}

export async function conteoDealsSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_deals").select("*", { count: "exact", head: true })
  return count || 0
}

export async function conteoPipedriveDeals(): Promise<number> { return conteoTotalPipedrive("deals") }

/* ==================================================
  ============================================================
  LEADS (id es UUID → pipedrive_id VARCHAR)
  ============================================================
================================================== */
export type LeadRow = {
  id: number
  pipedrive_id: string
  titulo: string | null
  valor: any
  origen_nombre: string | null
  archivado: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapLeadToRow(l: any) {
  return {
    pipedrive_id: String(l.id),
    titulo: truncate(l.title, 500),
    propietario_id: l.owner_id || null,
    creador_id: l.creator_id || null,
    label_ids: l.label_ids || [],
    persona_id: l.person_id || null,
    organizacion_id: l.organization_id || null,
    origen_nombre: truncate(l.source_name, 255),
    valor: l.value || null,
    expected_close_date: safeDate(l.expected_close_date),
    archivado: l.is_archived ?? false,
    visto: l.was_seen ?? false,
    visible_para: l.visible_to ? parseInt(l.visible_to) : null,
    channel: l.channel ?? null,
    channel_id: truncate(l.channel_id, 100),
    pipedrive_add_time: l.add_time || null,
    pipedrive_update_time: l.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteLeads(start: number): Promise<LoteResultado> {
  try {
    const limit = 100
    const url = `${PIPEDRIVE_BASE_URL}/leads?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}`
    const response = await fetch(url)
    const json = await response.json()
    if (!json.success || !json.data) {
      return { success: true, insertados: 0, omitidos: 0, errores: 0, erroresDetalle: [], total_lote: 0, hay_mas: false, next_start: start, mensaje: "No hay más datos en Pipedrive" }
    }
    const pipedriveIds = json.data.map((x: any) => String(x.id))
    const { data: existentes } = await supabase.from("pip_leads").select("pipedrive_id").in("pipedrive_id", pipedriveIds)
    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))
    const nuevos = json.data.filter((x: any) => !existentesSet.has(String(x.id)))
    const omitidos = json.data.length - nuevos.length
    let insertados = 0, errores = 0
    const erroresDetalle: ErrorDetalle[] = []
    for (const item of nuevos) {
      const { error } = await supabase.from("pip_leads").insert(mapLeadToRow(item))
      if (error) { errores++; erroresDetalle.push({ pipedrive_id: 0, nombre: item.title || "", error: error.message }) }
      else insertados++
    }
    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit
    return { success: true, insertados, omitidos, errores, erroresDetalle, total_lote: json.data.length, hay_mas: hayMas, next_start: nextStart, mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores` }
  } catch (error: any) {
    return { success: false, insertados: 0, omitidos: 0, errores: 1, erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }], total_lote: 0, hay_mas: false, next_start: start, mensaje: `Error: ${error.message}` }
  }
}

export async function verificarPipedriveLeads(): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/leads?api_token=${PIPEDRIVE_API_TOKEN}&start=0&limit=1`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()
    return { conectado: json.success === true, hayDatos: json.data && json.data.length > 0 }
  } catch { return { conectado: false, hayDatos: false } }
}

export async function obtenerLeadsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: LeadRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina
  const hasta = desde + porPagina - 1
  let query = supabase.from("pip_leads").select("id, pipedrive_id, titulo, valor, origen_nombre, archivado, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`titulo.ilike.%${busqueda}%,origen_nombre.ilike.%${busqueda}%`)
  query = query.order("id", { ascending: false }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo leads:", error.message); return { data: [], total: 0 } }
  return { data: (data as LeadRow[]) || [], total: count || 0 }
}

export async function conteoLeadsSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_leads").select("*", { count: "exact", head: true })
  return count || 0
}

export async function conteoPipedriveLeads(): Promise<number> { return conteoTotalPipedrive("leads") }

/* ==================================================
  ============================================================
  FILES
  ============================================================
================================================== */
export type FileRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  tipo: string | null
  file_size: number | null
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapFileToRow(f: any) {
  return {
    pipedrive_id: f.id,
    nombre: truncate(f.name, 500),
    archivo_nombre: truncate(f.file_name, 500),
    file_size: f.file_size ?? null,
    tipo: truncate(f.file_type, 100),
    url: f.url || null,
    remote_location: truncate(f.remote_location, 100),
    remote_id: truncate(f.remote_id, 255),
    deal_id: f.deal_id || null,
    person_id: f.person_id || null,
    org_id: f.org_id || null,
    activity_id: f.activity_id || null,
    lead_id: truncate(f.lead_id, 50),
    product_id: f.product_id || null,
    usuario_id: f.user_id || null,
    inline: f.inline_flag === true || f.inline_flag === 1,
    activo: f.active_flag ?? true,
    pipedrive_add_time: f.add_time || null,
    pipedrive_update_time: f.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteFiles(start: number): Promise<LoteResultado> {
  try {
    const limit = 100
    const url = `${PIPEDRIVE_BASE_URL}/files?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}`
    const response = await fetch(url)
    const json = await response.json()
    if (!json.success || !json.data) {
      return { success: true, insertados: 0, omitidos: 0, errores: 0, erroresDetalle: [], total_lote: 0, hay_mas: false, next_start: start, mensaje: "No hay más datos en Pipedrive" }
    }
    const pipedriveIds = json.data.map((x: any) => x.id)
    const { data: existentes } = await supabase.from("pip_files").select("pipedrive_id").in("pipedrive_id", pipedriveIds)
    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))
    const nuevos = json.data.filter((x: any) => !existentesSet.has(x.id))
    const omitidos = json.data.length - nuevos.length
    let insertados = 0, errores = 0
    const erroresDetalle: ErrorDetalle[] = []
    for (const item of nuevos) {
      const { error } = await supabase.from("pip_files").insert(mapFileToRow(item))
      if (error) { errores++; erroresDetalle.push({ pipedrive_id: item.id, nombre: item.name || "", error: error.message }) }
      else insertados++
    }
    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit
    return { success: true, insertados, omitidos, errores, erroresDetalle, total_lote: json.data.length, hay_mas: hayMas, next_start: nextStart, mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores` }
  } catch (error: any) {
    return { success: false, insertados: 0, omitidos: 0, errores: 1, erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }], total_lote: 0, hay_mas: false, next_start: start, mensaje: `Error: ${error.message}` }
  }
}

export async function verificarPipedriveFiles(): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/files?api_token=${PIPEDRIVE_API_TOKEN}&start=0&limit=1`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()
    return { conectado: json.success === true, hayDatos: json.data && json.data.length > 0 }
  } catch { return { conectado: false, hayDatos: false } }
}

export async function obtenerFilesSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: FileRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina
  const hasta = desde + porPagina - 1
  let query = supabase.from("pip_files").select("id, pipedrive_id, nombre, tipo, file_size, activo, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,tipo.ilike.%${busqueda}%`)
  query = query.order("pipedrive_id", { ascending: false }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo files:", error.message); return { data: [], total: 0 } }
  return { data: (data as FileRow[]) || [], total: count || 0 }
}

export async function conteoFilesSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_files").select("*", { count: "exact", head: true })
  return count || 0
}

export async function conteoPipedriveFiles(): Promise<number> { return conteoTotalPipedrive("files") }

/* ==================================================
  ============================================================
  Helper genérico para endpoints de listado simple (sin paginación)
  Trae TODO en una sola llamada (start=0) y devuelve hay_mas=false.
  ============================================================
================================================== */
async function extraerLoteSimple<T>(
  endpoint: string,
  tabla: string,
  pkField: "int" | "str",
  mapFn: (x: any) => any,
  nombreField: string,
  start: number,
): Promise<LoteResultado> {
  try {
    if (start > 0) {
      return { success: true, insertados: 0, omitidos: 0, errores: 0, erroresDetalle: [], total_lote: 0, hay_mas: false, next_start: start, mensaje: "No hay más datos en Pipedrive" }
    }
    const url = `${PIPEDRIVE_BASE_URL}/${endpoint}?api_token=${PIPEDRIVE_API_TOKEN}`
    const response = await fetch(url)
    const json = await response.json()
    if (!json.success || !json.data) {
      return { success: true, insertados: 0, omitidos: 0, errores: 0, erroresDetalle: [], total_lote: 0, hay_mas: false, next_start: start, mensaje: "No hay más datos en Pipedrive" }
    }
    const data: any[] = json.data
    // id: puede ser ausente (leadSources) → se usa name
    const getId = (x: any) => {
      if (x.id === undefined || x.id === null) return x.name
      return pkField === "str" ? String(x.id) : x.id
    }
    const pipedriveIds = data.map(getId)
    const { data: existentes } = await supabase.from(tabla).select("pipedrive_id").in("pipedrive_id", pipedriveIds)
    const existentesSet = new Set((existentes || []).map((e: any) => e.pipedrive_id))
    const nuevos = data.filter((x: any) => !existentesSet.has(getId(x)))
    const omitidos = data.length - nuevos.length
    let insertados = 0, errores = 0
    const erroresDetalle: ErrorDetalle[] = []
    for (const item of nuevos) {
      const { error } = await supabase.from(tabla).insert(mapFn(item))
      if (error) {
        errores++
        const idNum = typeof item.id === "number" ? item.id : 0
        erroresDetalle.push({ pipedrive_id: idNum, nombre: item[nombreField] || "", error: error.message })
      } else insertados++
    }
    return { success: true, insertados, omitidos, errores, erroresDetalle, total_lote: data.length, hay_mas: false, next_start: data.length, mensaje: `Lote procesado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores` }
  } catch (error: any) {
    return { success: false, insertados: 0, omitidos: 0, errores: 1, erroresDetalle: [{ pipedrive_id: 0, nombre: "", error: error.message }], total_lote: 0, hay_mas: false, next_start: start, mensaje: `Error: ${error.message}` }
  }
}

async function verificarSimple(endpoint: string): Promise<{ conectado: boolean; hayDatos: boolean }> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/${endpoint}?api_token=${PIPEDRIVE_API_TOKEN}`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const json = await response.json()
    return { conectado: json.success === true, hayDatos: json.data && json.data.length > 0 }
  } catch { return { conectado: false, hayDatos: false } }
}

async function conteoSimplePipedrive(endpoint: string): Promise<number> {
  try {
    const url = `${PIPEDRIVE_BASE_URL}/${endpoint}?api_token=${PIPEDRIVE_API_TOKEN}`
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    const json = await response.json()
    if (!json.success || !json.data) return 0
    return json.data.length
  } catch { return 0 }
}

/* ==================================================
  PIPELINES
================================================== */
export type PipelineRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  orden: number | null
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapPipelineToRow(p: any) {
  return {
    pipedrive_id: p.id,
    nombre: truncate(p.name, 255),
    url_title: truncate(p.url_title, 255),
    orden: p.order_nr ?? null,
    probabilidad: p.deal_probability === true || p.deal_probability === 1,
    activo: p.active ?? true,
    pipedrive_add_time: p.add_time || null,
    pipedrive_update_time: p.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLotePipelines(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("pipelines", "pip_pipelines", "int", mapPipelineToRow, "name", start)
}
export async function verificarPipedrivePipelines() { return verificarSimple("pipelines") }
export async function conteoPipedrivePipelines(): Promise<number> { return conteoSimplePipedrive("pipelines") }
export async function obtenerPipelinesSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: PipelineRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_pipelines").select("id, pipedrive_id, nombre, orden, activo, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%`)
  query = query.order("orden", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo pipelines:", error.message); return { data: [], total: 0 } }
  return { data: (data as PipelineRow[]) || [], total: count || 0 }
}
export async function conteoPipelinesSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_pipelines").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  STAGES
================================================== */
export type StageRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  pipeline_id: number | null
  pipeline_name: string | null
  orden: number | null
  probabilidad: number | null
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapStageToRow(s: any) {
  return {
    pipedrive_id: s.id,
    nombre: truncate(s.name, 255),
    pipeline_id: s.pipeline_id || null,
    pipeline_name: truncate(s.pipeline_name, 255),
    orden: s.order_nr ?? null,
    probabilidad: s.deal_probability ?? null,
    rotten: s.rotten_flag === true || s.rotten_flag === 1,
    rotten_days: s.rotten_days ?? null,
    activo: s.active_flag ?? true,
    pipedrive_add_time: s.add_time || null,
    pipedrive_update_time: s.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteStages(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("stages", "pip_stages", "int", mapStageToRow, "name", start)
}
export async function verificarPipedriveStages() { return verificarSimple("stages") }
export async function conteoPipedriveStages(): Promise<number> { return conteoSimplePipedrive("stages") }
export async function obtenerStagesSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: StageRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_stages").select("id, pipedrive_id, nombre, pipeline_id, pipeline_name, orden, probabilidad, activo, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,pipeline_name.ilike.%${busqueda}%`)
  query = query.order("pipeline_id", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo stages:", error.message); return { data: [], total: 0 } }
  return { data: (data as StageRow[]) || [], total: count || 0 }
}
export async function conteoStagesSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_stages").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  PRODUCTS
================================================== */
export type ProductRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  codigo: string | null
  unidad: string | null
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapProductToRow(p: any) {
  return {
    pipedrive_id: p.id,
    nombre: truncate(p.name, 500),
    codigo: truncate(p.code, 100),
    unidad: truncate(p.unit, 100),
    impuesto: p.tax != null ? Number(p.tax) : null,
    categoria: truncate(p.category, 255),
    descripcion: p.description || null,
    selectable: p.selectable ?? true,
    primer_caracter: truncate(p.first_char, 5),
    visible_para: p.visible_to ? parseInt(p.visible_to) : null,
    propietario_id: typeof p.owner_id === "object" ? p.owner_id?.id : p.owner_id || null,
    prices: p.prices || [],
    activo: p.active_flag ?? true,
    pipedrive_add_time: p.add_time || null,
    pipedrive_update_time: p.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteProducts(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("products", "pip_products", "int", mapProductToRow, "name", start)
}
export async function verificarPipedriveProducts() { return verificarSimple("products") }
export async function conteoPipedriveProducts(): Promise<number> { return conteoSimplePipedrive("products") }
export async function obtenerProductsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: ProductRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_products").select("id, pipedrive_id, nombre, codigo, unidad, activo, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%`)
  query = query.order("pipedrive_id", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo products:", error.message); return { data: [], total: 0 } }
  return { data: (data as ProductRow[]) || [], total: count || 0 }
}
export async function conteoProductsSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_products").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  ACTIVITY TYPES
================================================== */
export type ActivityTypeRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  clave: string | null
  color: string | null
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapActivityTypeToRow(a: any) {
  return {
    pipedrive_id: a.id,
    nombre: truncate(a.name, 255),
    clave: truncate(a.key_string, 100),
    icono: truncate(a.icon_key, 100),
    color: truncate(a.color, 20),
    orden: a.order_nr ?? null,
    es_custom: a.is_custom_flag === true || a.is_custom_flag === 1,
    activo: a.active_flag ?? true,
    pipedrive_add_time: a.add_time || null,
    pipedrive_update_time: a.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteActivityTypes(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("activityTypes", "pip_activity_types", "int", mapActivityTypeToRow, "name", start)
}
export async function verificarPipedriveActivityTypes() { return verificarSimple("activityTypes") }
export async function conteoPipedriveActivityTypes(): Promise<number> { return conteoSimplePipedrive("activityTypes") }
export async function obtenerActivityTypesSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: ActivityTypeRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_activity_types").select("id, pipedrive_id, nombre, clave, color, activo, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,clave.ilike.%${busqueda}%`)
  query = query.order("pipedrive_id", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo activityTypes:", error.message); return { data: [], total: 0 } }
  return { data: (data as ActivityTypeRow[]) || [], total: count || 0 }
}
export async function conteoActivityTypesSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_activity_types").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  FIELDS (genérico): personFields, dealFields, organizationFields,
  activityFields, productFields, noteFields
================================================== */
export type FieldRow = {
  id: number
  pipedrive_id: number
  clave: string | null
  nombre: string | null
  tipo: string | null
  obligatorio: boolean
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapFieldToRow(f: any) {
  return {
    pipedrive_id: f.id,
    clave: truncate(f.key, 100),
    nombre: truncate(f.name, 255),
    tipo: truncate(f.field_type, 50),
    grupo_id: f.group_id ?? null,
    orden: f.order_nr ?? null,
    activo: f.active_flag ?? true,
    editable: f.edit_flag ?? true,
    bulk_edit_allowed: f.bulk_edit_allowed ?? true,
    obligatorio: f.mandatory_flag === true || f.mandatory_flag === 1,
    options: f.options || null,
    pipedrive_add_time: f.add_time || null,
    pipedrive_update_time: f.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

async function obtenerFieldsSupabase(tabla: string, pagina: number, porPagina: number, busqueda: string): Promise<{ data: FieldRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from(tabla).select("id, pipedrive_id, clave, nombre, tipo, obligatorio, activo, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,clave.ilike.%${busqueda}%,tipo.ilike.%${busqueda}%`)
  query = query.order("pipedrive_id", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error(`Error obteniendo ${tabla}:`, error.message); return { data: [], total: 0 } }
  return { data: (data as FieldRow[]) || [], total: count || 0 }
}
async function conteoFieldsSupabase(tabla: string): Promise<number> {
  const { count } = await supabase.from(tabla).select("*", { count: "exact", head: true })
  return count || 0
}

// PERSON FIELDS
export async function extraerLotePersonFields(start: number): Promise<LoteResultado> { return extraerLoteSimple("personFields", "pip_person_fields", "int", mapFieldToRow, "name", start) }
export async function verificarPipedrivePersonFields() { return verificarSimple("personFields") }
export async function conteoPipedrivePersonFields(): Promise<number> { return conteoSimplePipedrive("personFields") }
export async function obtenerPersonFieldsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = "") { return obtenerFieldsSupabase("pip_person_fields", pagina, porPagina, busqueda) }
export async function conteoPersonFieldsSupabase(): Promise<number> { return conteoFieldsSupabase("pip_person_fields") }

// DEAL FIELDS
export async function extraerLoteDealFields(start: number): Promise<LoteResultado> { return extraerLoteSimple("dealFields", "pip_deal_fields", "int", mapFieldToRow, "name", start) }
export async function verificarPipedriveDealFields() { return verificarSimple("dealFields") }
export async function conteoPipedriveDealFields(): Promise<number> { return conteoSimplePipedrive("dealFields") }
export async function obtenerDealFieldsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = "") { return obtenerFieldsSupabase("pip_deal_fields", pagina, porPagina, busqueda) }
export async function conteoDealFieldsSupabase(): Promise<number> { return conteoFieldsSupabase("pip_deal_fields") }

// ORGANIZATION FIELDS
export async function extraerLoteOrganizationFields(start: number): Promise<LoteResultado> { return extraerLoteSimple("organizationFields", "pip_organization_fields", "int", mapFieldToRow, "name", start) }
export async function verificarPipedriveOrganizationFields() { return verificarSimple("organizationFields") }
export async function conteoPipedriveOrganizationFields(): Promise<number> { return conteoSimplePipedrive("organizationFields") }
export async function obtenerOrganizationFieldsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = "") { return obtenerFieldsSupabase("pip_organization_fields", pagina, porPagina, busqueda) }
export async function conteoOrganizationFieldsSupabase(): Promise<number> { return conteoFieldsSupabase("pip_organization_fields") }

// ACTIVITY FIELDS
export async function extraerLoteActivityFields(start: number): Promise<LoteResultado> { return extraerLoteSimple("activityFields", "pip_activity_fields", "int", mapFieldToRow, "name", start) }
export async function verificarPipedriveActivityFields() { return verificarSimple("activityFields") }
export async function conteoPipedriveActivityFields(): Promise<number> { return conteoSimplePipedrive("activityFields") }
export async function obtenerActivityFieldsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = "") { return obtenerFieldsSupabase("pip_activity_fields", pagina, porPagina, busqueda) }
export async function conteoActivityFieldsSupabase(): Promise<number> { return conteoFieldsSupabase("pip_activity_fields") }

// PRODUCT FIELDS
export async function extraerLoteProductFields(start: number): Promise<LoteResultado> { return extraerLoteSimple("productFields", "pip_product_fields", "int", mapFieldToRow, "name", start) }
export async function verificarPipedriveProductFields() { return verificarSimple("productFields") }
export async function conteoPipedriveProductFields(): Promise<number> { return conteoSimplePipedrive("productFields") }
export async function obtenerProductFieldsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = "") { return obtenerFieldsSupabase("pip_product_fields", pagina, porPagina, busqueda) }
export async function conteoProductFieldsSupabase(): Promise<number> { return conteoFieldsSupabase("pip_product_fields") }

// NOTE FIELDS
export async function extraerLoteNoteFields(start: number): Promise<LoteResultado> { return extraerLoteSimple("noteFields", "pip_note_fields", "int", mapFieldToRow, "name", start) }
export async function verificarPipedriveNoteFields() { return verificarSimple("noteFields") }
export async function conteoPipedriveNoteFields(): Promise<number> { return conteoSimplePipedrive("noteFields") }
export async function obtenerNoteFieldsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = "") { return obtenerFieldsSupabase("pip_note_fields", pagina, porPagina, busqueda) }
export async function conteoNoteFieldsSupabase(): Promise<number> { return conteoFieldsSupabase("pip_note_fields") }

/* ==================================================
  FILTERS
================================================== */
export type FilterRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  tipo: string | null
  activo: boolean
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapFilterToRow(f: any) {
  return {
    pipedrive_id: f.id,
    nombre: truncate(f.name, 255),
    tipo: truncate(f.type, 50),
    usuario_id: f.user_id || null,
    visible_para: f.visible_to ? parseInt(f.visible_to) : null,
    activo: f.active_flag ?? true,
    custom_view_id: f.custom_view_id || null,
    temporal: f.temporary_flag === true || f.temporary_flag === 1,
    pipedrive_add_time: f.add_time || null,
    pipedrive_update_time: f.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteFilters(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("filters", "pip_filters", "int", mapFilterToRow, "name", start)
}
export async function verificarPipedriveFilters() { return verificarSimple("filters") }
export async function conteoPipedriveFilters(): Promise<number> { return conteoSimplePipedrive("filters") }
export async function obtenerFiltersSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: FilterRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_filters").select("id, pipedrive_id, nombre, tipo, activo, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,tipo.ilike.%${busqueda}%`)
  query = query.order("pipedrive_id", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo filters:", error.message); return { data: [], total: 0 } }
  return { data: (data as FilterRow[]) || [], total: count || 0 }
}
export async function conteoFiltersSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_filters").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  CURRENCIES
================================================== */
export type CurrencyRow = {
  id: number
  pipedrive_id: number
  codigo: string | null
  nombre: string | null
  simbolo: string | null
  decimales: number | null
  activo: boolean
  fechaactualizacion: string | null
}

function mapCurrencyToRow(c: any) {
  return {
    pipedrive_id: c.id,
    codigo: truncate(c.code, 10),
    nombre: truncate(c.name, 100),
    simbolo: truncate(c.symbol, 10),
    decimales: c.decimal_points ?? null,
    activo: c.active_flag ?? true,
    es_custom: c.is_custom_flag === true || c.is_custom_flag === 1,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteCurrencies(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("currencies", "pip_currencies", "int", mapCurrencyToRow, "name", start)
}
export async function verificarPipedriveCurrencies() { return verificarSimple("currencies") }
export async function conteoPipedriveCurrencies(): Promise<number> { return conteoSimplePipedrive("currencies") }
export async function obtenerCurrenciesSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: CurrencyRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_currencies").select("id, pipedrive_id, codigo, nombre, simbolo, decimales, activo, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%`)
  query = query.order("codigo", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo currencies:", error.message); return { data: [], total: 0 } }
  return { data: (data as CurrencyRow[]) || [], total: count || 0 }
}
export async function conteoCurrenciesSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_currencies").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  LEAD LABELS
================================================== */
export type LeadLabelRow = {
  id: number
  pipedrive_id: string
  nombre: string | null
  color: string | null
  pipedrive_add_time: string | null
  fechaactualizacion: string | null
}

function mapLeadLabelToRow(l: any) {
  return {
    pipedrive_id: String(l.id),
    nombre: truncate(l.name, 255),
    color: truncate(l.color, 50),
    pipedrive_add_time: l.add_time || null,
    pipedrive_update_time: l.update_time || null,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteLeadLabels(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("leadLabels", "pip_lead_labels", "str", mapLeadLabelToRow, "name", start)
}
export async function verificarPipedriveLeadLabels() { return verificarSimple("leadLabels") }
export async function conteoPipedriveLeadLabels(): Promise<number> { return conteoSimplePipedrive("leadLabels") }
export async function obtenerLeadLabelsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: LeadLabelRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_lead_labels").select("id, pipedrive_id, nombre, color, pipedrive_add_time, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,color.ilike.%${busqueda}%`)
  query = query.order("id", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo leadLabels:", error.message); return { data: [], total: 0 } }
  return { data: (data as LeadLabelRow[]) || [], total: count || 0 }
}
export async function conteoLeadLabelsSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_lead_labels").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  LEAD SOURCES (sin id en Pipedrive, usa name como pipedrive_id)
================================================== */
export type LeadSourceRow = {
  id: number
  pipedrive_id: string
  nombre: string | null
  fechaactualizacion: string | null
}

function mapLeadSourceToRow(l: any) {
  return {
    pipedrive_id: truncate(l.name, 255),
    nombre: truncate(l.name, 255),
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteLeadSources(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("leadSources", "pip_lead_sources", "str", mapLeadSourceToRow, "name", start)
}
export async function verificarPipedriveLeadSources() { return verificarSimple("leadSources") }
export async function conteoPipedriveLeadSources(): Promise<number> { return conteoSimplePipedrive("leadSources") }
export async function obtenerLeadSourcesSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: LeadSourceRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_lead_sources").select("id, pipedrive_id, nombre, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%`)
  query = query.order("nombre", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo leadSources:", error.message); return { data: [], total: 0 } }
  return { data: (data as LeadSourceRow[]) || [], total: count || 0 }
}
export async function conteoLeadSourcesSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_lead_sources").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  PERMISSION SETS (id es UUID)
================================================== */
export type PermissionSetRow = {
  id: number
  pipedrive_id: string
  nombre: string | null
  tipo: string | null
  asignaciones_count: number | null
  fechaactualizacion: string | null
}

function mapPermissionSetToRow(p: any) {
  return {
    pipedrive_id: String(p.id),
    nombre: truncate(p.name, 255),
    description: p.description || null,
    app: truncate(p.app, 50),
    tipo: truncate(p.type, 50),
    asignaciones_count: p.assignment_count ?? 0,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLotePermissionSets(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("permissionSets", "pip_permission_sets", "str", mapPermissionSetToRow, "name", start)
}
export async function verificarPipedrivePermissionSets() { return verificarSimple("permissionSets") }
export async function conteoPipedrivePermissionSets(): Promise<number> { return conteoSimplePipedrive("permissionSets") }
export async function obtenerPermissionSetsSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: PermissionSetRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_permission_sets").select("id, pipedrive_id, nombre, tipo, asignaciones_count, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,tipo.ilike.%${busqueda}%`)
  query = query.order("id", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo permissionSets:", error.message); return { data: [], total: 0 } }
  return { data: (data as PermissionSetRow[]) || [], total: count || 0 }
}
export async function conteoPermissionSetsSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_permission_sets").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  ROLES
================================================== */
export type RoleRow = {
  id: number
  pipedrive_id: number
  nombre: string | null
  assignment_count: number | null
  fechaactualizacion: string | null
}

function mapRoleToRow(r: any) {
  return {
    pipedrive_id: r.id,
    nombre: truncate(r.name, 255),
    rol_padre_id: r.parent_role_id || null,
    activo: r.active_flag ?? true,
    assignment_count: r.assignment_count ?? 0,
    sub_role_count: r.sub_role_count ?? 0,
    fechaactualizacion: new Date().toISOString(),
  }
}

export async function extraerLoteRoles(start: number): Promise<LoteResultado> {
  return extraerLoteSimple("roles", "pip_roles", "int", mapRoleToRow, "name", start)
}
export async function verificarPipedriveRoles() { return verificarSimple("roles") }
export async function conteoPipedriveRoles(): Promise<number> { return conteoSimplePipedrive("roles") }
export async function obtenerRolesSupabase(pagina: number = 1, porPagina: number = 20, busqueda: string = ""): Promise<{ data: RoleRow[]; total: number }> {
  const desde = (pagina - 1) * porPagina, hasta = desde + porPagina - 1
  let query = supabase.from("pip_roles").select("id, pipedrive_id, nombre, assignment_count, fechaactualizacion", { count: "exact" })
  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%`)
  query = query.order("pipedrive_id", { ascending: true }).range(desde, hasta)
  const { data, count, error } = await query
  if (error) { console.error("Error obteniendo roles:", error.message); return { data: [], total: 0 } }
  return { data: (data as RoleRow[]) || [], total: count || 0 }
}
export async function conteoRolesSupabase(): Promise<number> {
  const { count } = await supabase.from("pip_roles").select("*", { count: "exact", head: true })
  return count || 0
}

/* ==================================================
  Búsqueda de persona por email/teléfono en Pipedrive
  (usado en /clientes/new para validar existencia previa)
================================================== */
export type MatchPipedrive = {
  id: number
  nombre: string
  emails: string[]
  telefonos: string[]
  origen: "email" | "telefono"
  fuente: "pipedrive" | "clientes"
}

export type ResultadoValidacionPipedrive = {
  success: boolean
  disponible: boolean
  matches: MatchPipedrive[]
  mensaje: string
}

async function buscarPersonasEnPipedrive(term: string, field: "email" | "phone"): Promise<MatchPipedrive[]> {
  const url = `${PIPEDRIVE_BASE_URL}/persons/search?api_token=${PIPEDRIVE_API_TOKEN}&term=${encodeURIComponent(term)}&fields=${field}&exact_match=true&limit=20`
  const res = await fetch(url)
  const json = await res.json()
  if (!json.success || !json.data || !json.data.items) return []
  return json.data.items.map((it: any) => {
    const item = it.item || {}
    return {
      id: item.id,
      nombre: item.name || "",
      emails: Array.isArray(item.emails) ? item.emails : [],
      telefonos: Array.isArray(item.phones) ? item.phones : [],
      origen: field === "email" ? "email" : "telefono",
      fuente: "pipedrive",
    } as MatchPipedrive
  })
}

async function buscarClientesEnSupabase(email: string, telefono: string): Promise<MatchPipedrive[]> {
  const matches: MatchPipedrive[] = []
  if (email) {
    const { data } = await supabase
      .from("clientes")
      .select("id, nombre, apellidos, email, telefono")
      .ilike("email", email)
      .limit(20)
    for (const c of data || []) {
      matches.push({
        id: (c as any).id,
        nombre: [(c as any).nombre, (c as any).apellidos].filter(Boolean).join(" ").trim(),
        emails: (c as any).email ? [(c as any).email] : [],
        telefonos: (c as any).telefono ? [(c as any).telefono] : [],
        origen: "email",
        fuente: "clientes",
      })
    }
  }
  if (telefono) {
    const { data } = await supabase
      .from("clientes")
      .select("id, nombre, apellidos, email, telefono")
      .eq("telefono", telefono)
      .limit(20)
    for (const c of data || []) {
      matches.push({
        id: (c as any).id,
        nombre: [(c as any).nombre, (c as any).apellidos].filter(Boolean).join(" ").trim(),
        emails: (c as any).email ? [(c as any).email] : [],
        telefonos: (c as any).telefono ? [(c as any).telefono] : [],
        origen: "telefono",
        fuente: "clientes",
      })
    }
  }
  return matches
}

export async function validarClienteEnPipedrive(
  email: string,
  telefono: string,
): Promise<ResultadoValidacionPipedrive> {
  const emailClean = (email || "").trim().toLowerCase()
  const telClean = (telefono || "").trim()

  if (!emailClean && !telClean) {
    return { success: false, disponible: false, matches: [], mensaje: "Debes ingresar email o teléfono para validar." }
  }

  try {
    const tareas: Promise<MatchPipedrive[]>[] = []
    if (emailClean) tareas.push(buscarPersonasEnPipedrive(emailClean, "email"))
    if (telClean) tareas.push(buscarPersonasEnPipedrive(telClean, "phone"))
    tareas.push(buscarClientesEnSupabase(emailClean, telClean))

    const resultados = await Promise.all(tareas)
    const matches: MatchPipedrive[] = []
    const seen = new Set<string>()
    for (const lista of resultados) {
      for (const m of lista) {
        const key = `${m.fuente}:${m.id}`
        if (!seen.has(key)) {
          seen.add(key)
          matches.push(m)
        }
      }
    }

    if (matches.length === 0) {
      return {
        success: true,
        disponible: true,
        matches: [],
        mensaje: "No se encontraron coincidencias en Pipedrive ni en clientes. Puedes continuar con el alta.",
      }
    }

    const enPipedrive = matches.some((m) => m.fuente === "pipedrive")
    const enClientes = matches.some((m) => m.fuente === "clientes")
    let mensaje = `Se encontraron ${matches.length} coincidencia(s). `
    if (enPipedrive && enClientes) {
      mensaje += `Existe en Pipedrive y en clientes. Usa "Actualizar con Pipedrive" en /clientes.`
    } else if (enPipedrive) {
      mensaje += `Existe en Pipedrive. Usa "Actualizar con Pipedrive" en /clientes para sincronizar.`
    } else {
      mensaje += `Ya existe en la tabla clientes.`
    }

    return { success: true, disponible: false, matches, mensaje }
  } catch (err: any) {
    return { success: false, disponible: false, matches: [], mensaje: `Error consultando Pipedrive/clientes: ${err?.message || "desconocido"}` }
  }
}
