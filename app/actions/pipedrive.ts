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
export type LoteResultado = {
  success: boolean
  insertados: number
  omitidos: number
  errores: number
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
  Mapear person de Pipedrive → row Supabase
================================================== */
function mapPersonToRow(p: any) {
  return {
    pipedrive_id: p.id,
    nombre: p.name || null,
    primer_nombre: p.first_name || null,
    apellidos: p.last_name || null,
    puesto: p.job_title || null,
    email: p.email || [],
    telefono: p.phone || [],
    mensajeria_instantanea: p.im?.[0]?.value || null,
    organizacion_id: typeof p.org_id === "object" ? p.org_id?.value : p.org_id || null,
    organizacion_nombre: typeof p.org_id === "object" ? p.org_id?.name : p.org_name || null,
    propietario_id: typeof p.owner_id === "object" ? p.owner_id?.id : p.owner_id || null,
    propietario_nombre: typeof p.owner_id === "object" ? p.owner_id?.name : p.owner_name || null,
    direccion_postal: p.postal_address || null,
    direccion_subpremise: p.postal_address_subpremise || null,
    direccion_numero_casa: p.postal_address_street_number || null,
    direccion_calle: p.postal_address_route || null,
    direccion_sublocalidad: p.postal_address_sublocality || null,
    direccion_ciudad: p.postal_address_locality || null,
    direccion_estado: p.postal_address_admin_area_level_1 || null,
    direccion_region: p.postal_address_admin_area_level_2 || null,
    direccion_pais: p.postal_address_country || null,
    direccion_codigo_postal: p.postal_address_postal_code || null,
    direccion_completa: p.postal_address_formatted_address || null,
    direccion_custom: p[CF.dir] || null,
    direccion_custom_ciudad: p[`${CF.dir}_locality`] || null,
    direccion_custom_estado: p[`${CF.dir}_admin_area_level_1`] || null,
    direccion_custom_pais: p[`${CF.dir}_country`] || null,
    direccion_custom_codigo_postal: p[`${CF.dir}_postal_code`] || null,
    direccion_custom_completa: p[`${CF.dir}_formatted_address`] || null,
    division_filial_area: p[CF.division_filial] || null,
    tipo_contacto: p[CF.tipo_contacto] || null,
    tipo_reservas: p[CF.tipo_reservas] || null,
    potencial_mensual_cn: p[CF.potencial_mensual] || null,
    cumpleanos: p[CF.cumpleanos] || null,
    afiliado_fidelizacion: p[CF.afiliado_fidelizacion] || null,
    whatsapp_chat_link: p[CF.whatsapp_link] || null,
    tratos_abiertos: p.open_deals_count || 0,
    tratos_cerrados: p.closed_deals_count || 0,
    tratos_ganados: p.won_deals_count || 0,
    tratos_perdidos: p.lost_deals_count || 0,
    actividades_total: p.activities_count || 0,
    actividades_completadas: p.done_activities_count || 0,
    actividades_pendientes: p.undone_activities_count || 0,
    emails_count: p.email_messages_count || 0,
    marketing_status: p.marketing_status || null,
    etiqueta: p.label || null,
    etiqueta_ids: p.label_ids || [],
    notas: p.notes || null,
    foto_id: typeof p.picture_id === "object" ? p.picture_id?.value || null : p.picture_id || null,
    visible_para: p.visible_to ? parseInt(p.visible_to) : null,
    fecha_proxima_actividad: p.next_activity_date || null,
    fecha_ultima_actividad: p.last_activity_date || null,
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
    const url = `${PIPEDRIVE_BASE_URL}/persons?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}`
    const response = await fetch(url)
    const json = await response.json()

    if (!json.success || !json.data) {
      return {
        success: true,
        insertados: 0,
        omitidos: 0,
        errores: 0,
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    let insertados = 0
    let omitidos = 0
    let errores = 0

    for (const person of json.data) {
      const row = mapPersonToRow(person)

      // upsert con ignoreDuplicates: si pipedrive_id ya existe, no hace nada (omite)
      const { error, status } = await supabase
        .from("persons")
        .upsert(row, { onConflict: "pipedrive_id", ignoreDuplicates: true })

      if (error) {
        console.error(`Error insertando person ${person.id}:`, error.message)
        errores++
      } else {
        // status 201 = inserted, 200/204 = no change (duplicate ignored)
        if (status === 201) {
          insertados++
        } else {
          omitidos++
        }
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
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
    .from("persons")
    .select(
      "id, pipedrive_id, nombre, primer_nombre, apellidos, puesto, email, telefono, organizacion_nombre, propietario_nombre, activo, pipedrive_add_time, fechaactualizacion",
      { count: "exact" },
    )

  if (busqueda) {
    query = query.or(`nombre.ilike.%${busqueda}%,organizacion_nombre.ilike.%${busqueda}%`)
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
    .from("persons")
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
    nombre: o.name || null,
    primer_caracter: o.first_char || null,
    propietario_id: typeof o.owner_id === "object" ? o.owner_id?.id : o.owner_id || null,
    propietario_nombre: typeof o.owner_id === "object" ? o.owner_id?.name : o.owner_name || null,
    direccion: o.address || null,
    direccion_subpremise: o.address_subpremise || null,
    direccion_numero_casa: o.address_street_number || null,
    direccion_calle: o.address_route || null,
    direccion_sublocalidad: o.address_sublocality || null,
    direccion_ciudad: o.address_locality || null,
    direccion_estado: o.address_admin_area_level_1 || null,
    direccion_region: o.address_admin_area_level_2 || null,
    direccion_pais: o.address_country || null,
    direccion_codigo_postal: o.address_postal_code || null,
    direccion_completa: o.address_formatted_address || null,
    cc_email: o.cc_email || null,
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
    fecha_proxima_actividad: o.next_activity_date || null,
    fecha_ultima_actividad: o.last_activity_date || null,
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
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    let insertados = 0
    let omitidos = 0
    let errores = 0

    for (const org of json.data) {
      const row = mapOrganizationToRow(org)

      const { error, status } = await supabase
        .from("organizations")
        .upsert(row, { onConflict: "pipedrive_id", ignoreDuplicates: true })

      if (error) {
        console.error(`Error insertando organization ${org.id}:`, error.message)
        errores++
      } else {
        if (status === 201) {
          insertados++
        } else {
          omitidos++
        }
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
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
    .from("organizations")
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
    .from("organizations")
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
    asunto: a.subject || null,
    tipo: a.type || null,
    nota: a.note || null,
    descripcion_publica: a.public_description || null,
    prioridad: a.priority || null,
    trato_id: a.deal_id || null,
    lead_id: a.lead_id || null,
    persona_id: a.person_id || null,
    organizacion_id: a.org_id || null,
    proyecto_id: a.project_id || null,
    propietario_id: a.user_id || a.owner_id || null,
    creador_id: a.creator_user_id || null,
    fecha_vencimiento: a.due_date || null,
    hora_vencimiento: a.due_time || null,
    duracion: a.duration || null,
    completado: a.done === true || a.done === 1,
    fecha_completado: a.marked_as_done_time || null,
    ubicacion: loc ? loc.value : (typeof a.location === "string" ? a.location : null),
    ubicacion_pais: loc?.country || null,
    ubicacion_estado: loc?.admin_area_level_1 || null,
    ubicacion_region: loc?.admin_area_level_2 || null,
    ubicacion_ciudad: loc?.locality || null,
    ubicacion_sublocalidad: loc?.sublocality || null,
    ubicacion_calle: loc?.route || null,
    ubicacion_numero_casa: loc?.street_number || null,
    ubicacion_subpremise: loc?.subpremise || null,
    ubicacion_codigo_postal: loc?.postal_code || null,
    participantes: a.participants || [],
    asistentes: a.attendees || [],
    conferencia_cliente: a.conference_meeting_client || null,
    conferencia_url: a.conference_meeting_url || null,
    conferencia_id: a.conference_meeting_id || null,
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
    const limit = 100
    const url = `${PIPEDRIVE_BASE_URL}/activities?api_token=${PIPEDRIVE_API_TOKEN}&start=${start}&limit=${limit}`
    const response = await fetch(url)
    const json = await response.json()

    if (!json.success || !json.data) {
      return {
        success: true,
        insertados: 0,
        omitidos: 0,
        errores: 0,
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    let insertados = 0
    let omitidos = 0
    let errores = 0

    for (const activity of json.data) {
      const row = mapActivityToRow(activity)

      const { error, status } = await supabase
        .from("pip_activities")
        .upsert(row, { onConflict: "pipedrive_id", ignoreDuplicates: true })

      if (error) {
        console.error(`Error insertando activity ${activity.id}:`, error.message)
        errores++
      } else {
        if (status === 201) {
          insertados++
        } else {
          omitidos++
        }
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
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
    const url = `${PIPEDRIVE_BASE_URL}/activities?api_token=${PIPEDRIVE_API_TOKEN}&start=0&limit=1`
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
    titulo: t.title || null,
    descripcion: t.description || null,
    proyecto_id: t.project_id || null,
    tarea_padre_id: t.parent_task_id || null,
    asignado_id: t.assignee_id || null,
    asignado_ids: t.assignee_ids || [],
    creador_id: t.creator_id || null,
    completado: t.done === 1 || t.done === true,
    fecha_completado: t.marked_as_done_time || null,
    fecha_vencimiento: t.due_date || null,
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
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    let insertados = 0
    let omitidos = 0
    let errores = 0

    for (const task of json.data) {
      const row = mapTaskToRow(task)

      const { error, status } = await supabase
        .from("pip_tasks")
        .upsert(row, { onConflict: "pipedrive_id", ignoreDuplicates: true })

      if (error) {
        console.error(`Error insertando task ${task.id}:`, error.message)
        errores++
      } else {
        if (status === 201) {
          insertados++
        } else {
          omitidos++
        }
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
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
    trato_titulo: typeof n.deal === "object" ? n.deal?.title : null,
    lead_id: n.lead_id || null,
    persona_id: n.person_id || null,
    persona_nombre: typeof n.person === "object" ? n.person?.name : null,
    organizacion_id: n.org_id || null,
    organizacion_nombre: typeof n.organization === "object" ? n.organization?.name : null,
    proyecto_id: n.project_id || null,
    proyecto_titulo: typeof n.project === "object" ? n.project?.title : null,
    usuario_id: n.user_id || null,
    usuario_nombre: typeof n.user === "object" ? n.user?.name : null,
    usuario_email: typeof n.user === "object" ? n.user?.email : null,
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
        total_lote: 0,
        hay_mas: false,
        next_start: start,
        mensaje: "No hay más datos en Pipedrive",
      }
    }

    let insertados = 0
    let omitidos = 0
    let errores = 0

    for (const note of json.data) {
      const row = mapNoteToRow(note)

      const { error, status } = await supabase
        .from("pip_notes")
        .upsert(row, { onConflict: "pipedrive_id", ignoreDuplicates: true })

      if (error) {
        console.error(`Error insertando note ${note.id}:`, error.message)
        errores++
      } else {
        if (status === 201) {
          insertados++
        } else {
          omitidos++
        }
      }
    }

    const hayMas = json.additional_data?.pagination?.more_items_in_collection ?? false
    const nextStart = json.additional_data?.pagination?.next_start ?? start + limit

    return {
      success: true,
      insertados,
      omitidos,
      errores,
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
