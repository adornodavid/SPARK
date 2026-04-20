"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export type MobiliarioRow = {
  id: number
  nombre: string | null
  descripcion: string | null
  costo: number | null
  activo: boolean | null
  hotelid: number | null
  hotelnombre: string | null
}

/**
 * Lista mobiliario filtrando opcionalmente por hotelid.
 * Resuelve el nombre del hotel (join manual) porque no hay FK declarada.
 * hotelid = -1 o null → Todos los hoteles.
 */
export async function listarMobiliarioPorHotel(
  hotelid: number | null = null,
  search: string = "",
): Promise<{ success: boolean; error?: string; data: MobiliarioRow[] }> {
  try {
    let q = supabase
      .from("mobiliario")
      .select("id, nombre, descripcion, costo, activo, hotelid")

    if (hotelid && hotelid !== -1) {
      q = q.eq("hotelid", hotelid)
    }
    const s = (search ?? "").trim()
    if (s) {
      q = q.ilike("nombre", `%${s}%`)
    }

    const { data, error } = await q
    if (error) return { success: false, error: error.message, data: [] }

    const rows = (data ?? []) as Array<{
      id: number
      nombre: string | null
      descripcion: string | null
      costo: number | null
      activo: boolean | null
      hotelid: number | null
    }>

    const ids = Array.from(
      new Set(rows.map((r) => r.hotelid).filter((v): v is number => v !== null && v !== undefined)),
    )

    let nombresPorId = new Map<number, string>()
    if (ids.length > 0) {
      const { data: hoteles, error: eH } = await supabase
        .from("hoteles")
        .select("id, nombre")
        .in("id", ids)
      if (eH) return { success: false, error: eH.message, data: [] }
      nombresPorId = new Map(
        (hoteles ?? []).map((h: { id: number; nombre: string | null }) => [h.id, h.nombre ?? ""]),
      )
    }

    const out: MobiliarioRow[] = rows
      .map((r) => ({
        ...r,
        hotelnombre: r.hotelid != null ? nombresPorId.get(r.hotelid) ?? null : null,
      }))
      .sort((a, b) => {
        const ha = (a.hotelnombre ?? "").toLocaleLowerCase("es-MX")
        const hb = (b.hotelnombre ?? "").toLocaleLowerCase("es-MX")
        const byHotel = ha.localeCompare(hb, "es-MX")
        if (byHotel !== 0) return byHotel
        const na = (a.nombre ?? "").toLocaleLowerCase("es-MX")
        const nb = (b.nombre ?? "").toLocaleLowerCase("es-MX")
        const byNombre = na.localeCompare(nb, "es-MX")
        if (byNombre !== 0) return byNombre
        return a.id - b.id
      })

    return { success: true, data: out }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error listando mobiliario: " + msg, data: [] }
  }
}

export type ServicioRow = {
  id: number
  nombre: string | null
  descripcion: string | null
  costo: number | null
  activo: boolean | null
  hotelid: number | null
  hotelnombre: string | null
}

export async function listarServicioPorHotel(
  hotelid: number | null = null,
  search: string = "",
): Promise<{ success: boolean; error?: string; data: ServicioRow[] }> {
  try {
    let q = supabase
      .from("servicio")
      .select("id, nombre, descripcion, costo, activo, hotelid")

    if (hotelid && hotelid !== -1) {
      q = q.eq("hotelid", hotelid)
    }
    const s = (search ?? "").trim()
    if (s) {
      q = q.ilike("nombre", `%${s}%`)
    }

    const { data, error } = await q
    if (error) return { success: false, error: error.message, data: [] }

    const rows = (data ?? []) as Array<{
      id: number
      nombre: string | null
      descripcion: string | null
      costo: number | null
      activo: boolean | null
      hotelid: number | null
    }>

    const ids = Array.from(
      new Set(rows.map((r) => r.hotelid).filter((v): v is number => v !== null && v !== undefined)),
    )

    let nombresPorId = new Map<number, string>()
    if (ids.length > 0) {
      const { data: hoteles, error: eH } = await supabase
        .from("hoteles")
        .select("id, nombre")
        .in("id", ids)
      if (eH) return { success: false, error: eH.message, data: [] }
      nombresPorId = new Map(
        (hoteles ?? []).map((h: { id: number; nombre: string | null }) => [h.id, h.nombre ?? ""]),
      )
    }

    const out: ServicioRow[] = rows
      .map((r) => ({
        ...r,
        hotelnombre: r.hotelid != null ? nombresPorId.get(r.hotelid) ?? null : null,
      }))
      .sort((a, b) => {
        const ha = (a.hotelnombre ?? "").toLocaleLowerCase("es-MX")
        const hb = (b.hotelnombre ?? "").toLocaleLowerCase("es-MX")
        const byHotel = ha.localeCompare(hb, "es-MX")
        if (byHotel !== 0) return byHotel
        const na = (a.nombre ?? "").toLocaleLowerCase("es-MX")
        const nb = (b.nombre ?? "").toLocaleLowerCase("es-MX")
        const byNombre = na.localeCompare(nb, "es-MX")
        if (byNombre !== 0) return byNombre
        return a.id - b.id
      })

    return { success: true, data: out }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error listando servicio: " + msg, data: [] }
  }
}

export async function validarNombreServicio(
  nombre: string,
  hotelid: number | null,
  excluirId: number | null = null,
): Promise<{ disponible: boolean; mensaje: string }> {
  try {
    const v = (nombre ?? "").trim()
    if (!v) return { disponible: false, mensaje: "El nombre está vacío." }
    if (!hotelid) return { disponible: false, mensaje: "Selecciona un hotel primero." }

    let q = supabase
      .from("servicio")
      .select("id")
      .ilike("nombre", v)
      .eq("hotelid", hotelid)
    if (excluirId != null) q = q.neq("id", excluirId)
    const { data, error } = await q.limit(1).maybeSingle()

    if (error) return { disponible: false, mensaje: error.message }
    if (data) return { disponible: false, mensaje: "Ya existe un servicio con ese nombre para este hotel." }
    return { disponible: true, mensaje: "Nombre disponible." }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { disponible: false, mensaje: "Error validando: " + msg }
  }
}

export type CrearServicioPayload = {
  hotelid: number
  nombre: string
  descripcion: string
  costo: number | null
  activo: boolean
}

export async function crearServicio(
  payload: CrearServicioPayload,
): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const nombre = (payload.nombre ?? "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }
    if (!payload.hotelid) return { success: false, error: "El hotel es obligatorio." }

    const hoy = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from("servicio")
      .insert({
        nombre,
        descripcion: (payload.descripcion ?? "").trim() || null,
        costo: payload.costo,
        activo: payload.activo,
        fechacreacion: hoy,
        hotelid: payload.hotelid,
      })
      .select("id")
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id as number }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error creando servicio: " + msg }
  }
}

export type CortesiaRow = {
  id: number
  nombre: string | null
  descripcion: string | null
  costo: number | null
  activo: boolean | null
  hotelid: number | null
  hotelnombre: string | null
}

export async function listarCortesiaPorHotel(
  hotelid: number | null = null,
  search: string = "",
): Promise<{ success: boolean; error?: string; data: CortesiaRow[] }> {
  try {
    let q = supabase
      .from("cortesias")
      .select("id, nombre, descripcion, costo, activo, hotelid")

    if (hotelid && hotelid !== -1) {
      q = q.eq("hotelid", hotelid)
    }
    const s = (search ?? "").trim()
    if (s) {
      q = q.ilike("nombre", `%${s}%`)
    }

    const { data, error } = await q
    if (error) return { success: false, error: error.message, data: [] }

    const rows = (data ?? []) as Array<{
      id: number
      nombre: string | null
      descripcion: string | null
      costo: number | null
      activo: boolean | null
      hotelid: number | null
    }>

    const ids = Array.from(
      new Set(rows.map((r) => r.hotelid).filter((v): v is number => v !== null && v !== undefined)),
    )

    let nombresPorId = new Map<number, string>()
    if (ids.length > 0) {
      const { data: hoteles, error: eH } = await supabase
        .from("hoteles")
        .select("id, nombre")
        .in("id", ids)
      if (eH) return { success: false, error: eH.message, data: [] }
      nombresPorId = new Map(
        (hoteles ?? []).map((h: { id: number; nombre: string | null }) => [h.id, h.nombre ?? ""]),
      )
    }

    const out: CortesiaRow[] = rows
      .map((r) => ({
        ...r,
        hotelnombre: r.hotelid != null ? nombresPorId.get(r.hotelid) ?? null : null,
      }))
      .sort((a, b) => {
        const ha = (a.hotelnombre ?? "").toLocaleLowerCase("es-MX")
        const hb = (b.hotelnombre ?? "").toLocaleLowerCase("es-MX")
        const byHotel = ha.localeCompare(hb, "es-MX")
        if (byHotel !== 0) return byHotel
        const na = (a.nombre ?? "").toLocaleLowerCase("es-MX")
        const nb = (b.nombre ?? "").toLocaleLowerCase("es-MX")
        const byNombre = na.localeCompare(nb, "es-MX")
        if (byNombre !== 0) return byNombre
        return a.id - b.id
      })

    return { success: true, data: out }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error listando cortesias: " + msg, data: [] }
  }
}

export async function validarNombreCortesia(
  nombre: string,
  hotelid: number | null,
  excluirId: number | null = null,
): Promise<{ disponible: boolean; mensaje: string }> {
  try {
    const v = (nombre ?? "").trim()
    if (!v) return { disponible: false, mensaje: "El nombre está vacío." }
    if (!hotelid) return { disponible: false, mensaje: "Selecciona un hotel primero." }

    let q = supabase
      .from("cortesias")
      .select("id")
      .ilike("nombre", v)
      .eq("hotelid", hotelid)
    if (excluirId != null) q = q.neq("id", excluirId)
    const { data, error } = await q.limit(1).maybeSingle()

    if (error) return { disponible: false, mensaje: error.message }
    if (data) return { disponible: false, mensaje: "Ya existe una cortesía con ese nombre para este hotel." }
    return { disponible: true, mensaje: "Nombre disponible." }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { disponible: false, mensaje: "Error validando: " + msg }
  }
}

export type CrearCortesiaPayload = {
  hotelid: number
  nombre: string
  descripcion: string
  costo: number | null
  activo: boolean
}

export async function crearCortesia(
  payload: CrearCortesiaPayload,
): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const nombre = (payload.nombre ?? "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }
    if (!payload.hotelid) return { success: false, error: "El hotel es obligatorio." }

    const hoy = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from("cortesias")
      .insert({
        nombre,
        descripcion: (payload.descripcion ?? "").trim() || null,
        costo: payload.costo,
        activo: payload.activo,
        fechacreacion: hoy,
        hotelid: payload.hotelid,
      })
      .select("id")
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id as number }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error creando cortesía: " + msg }
  }
}

export type BeneficioRow = {
  id: number
  nombre: string | null
  descripcion: string | null
  costo: number | null
  activo: boolean | null
  hotelid: number | null
  hotelnombre: string | null
}

export async function listarBeneficioPorHotel(
  hotelid: number | null = null,
  search: string = "",
): Promise<{ success: boolean; error?: string; data: BeneficioRow[] }> {
  try {
    let q = supabase
      .from("beneficiosadicionales")
      .select("id, nombre, descripcion, costo, activo, hotelid")

    if (hotelid && hotelid !== -1) {
      q = q.eq("hotelid", hotelid)
    }
    const s = (search ?? "").trim()
    if (s) {
      q = q.ilike("nombre", `%${s}%`)
    }

    const { data, error } = await q
    if (error) return { success: false, error: error.message, data: [] }

    const rows = (data ?? []) as Array<{
      id: number
      nombre: string | null
      descripcion: string | null
      costo: number | null
      activo: boolean | null
      hotelid: number | null
    }>

    const ids = Array.from(
      new Set(rows.map((r) => r.hotelid).filter((v): v is number => v !== null && v !== undefined)),
    )

    let nombresPorId = new Map<number, string>()
    if (ids.length > 0) {
      const { data: hoteles, error: eH } = await supabase
        .from("hoteles")
        .select("id, nombre")
        .in("id", ids)
      if (eH) return { success: false, error: eH.message, data: [] }
      nombresPorId = new Map(
        (hoteles ?? []).map((h: { id: number; nombre: string | null }) => [h.id, h.nombre ?? ""]),
      )
    }

    const out: BeneficioRow[] = rows
      .map((r) => ({
        ...r,
        hotelnombre: r.hotelid != null ? nombresPorId.get(r.hotelid) ?? null : null,
      }))
      .sort((a, b) => {
        const ha = (a.hotelnombre ?? "").toLocaleLowerCase("es-MX")
        const hb = (b.hotelnombre ?? "").toLocaleLowerCase("es-MX")
        const byHotel = ha.localeCompare(hb, "es-MX")
        if (byHotel !== 0) return byHotel
        const na = (a.nombre ?? "").toLocaleLowerCase("es-MX")
        const nb = (b.nombre ?? "").toLocaleLowerCase("es-MX")
        const byNombre = na.localeCompare(nb, "es-MX")
        if (byNombre !== 0) return byNombre
        return a.id - b.id
      })

    return { success: true, data: out }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error listando beneficios: " + msg, data: [] }
  }
}

export async function validarNombreBeneficio(
  nombre: string,
  hotelid: number | null,
  excluirId: number | null = null,
): Promise<{ disponible: boolean; mensaje: string }> {
  try {
    const v = (nombre ?? "").trim()
    if (!v) return { disponible: false, mensaje: "El nombre está vacío." }
    if (!hotelid) return { disponible: false, mensaje: "Selecciona un hotel primero." }

    let q = supabase
      .from("beneficiosadicionales")
      .select("id")
      .ilike("nombre", v)
      .eq("hotelid", hotelid)
    if (excluirId != null) q = q.neq("id", excluirId)
    const { data, error } = await q.limit(1).maybeSingle()

    if (error) return { disponible: false, mensaje: error.message }
    if (data) return { disponible: false, mensaje: "Ya existe un beneficio con ese nombre para este hotel." }
    return { disponible: true, mensaje: "Nombre disponible." }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { disponible: false, mensaje: "Error validando: " + msg }
  }
}

export type CrearBeneficioPayload = {
  hotelid: number
  nombre: string
  descripcion: string
  costo: number | null
  activo: boolean
}

export async function crearBeneficio(
  payload: CrearBeneficioPayload,
): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const nombre = (payload.nombre ?? "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }
    if (!payload.hotelid) return { success: false, error: "El hotel es obligatorio." }

    const hoy = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from("beneficiosadicionales")
      .insert({
        nombre,
        descripcion: (payload.descripcion ?? "").trim() || null,
        costo: payload.costo,
        activo: payload.activo,
        fechacreacion: hoy,
        hotelid: payload.hotelid,
      })
      .select("id")
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id as number }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error creando beneficio: " + msg }
  }
}

export async function validarNombreMobiliario(
  nombre: string,
  hotelid: number | null,
  excluirId: number | null = null,
): Promise<{ disponible: boolean; mensaje: string }> {
  try {
    const v = (nombre ?? "").trim()
    if (!v) return { disponible: false, mensaje: "El nombre está vacío." }
    if (!hotelid) return { disponible: false, mensaje: "Selecciona un hotel primero." }

    let q = supabase
      .from("mobiliario")
      .select("id")
      .ilike("nombre", v)
      .eq("hotelid", hotelid)
    if (excluirId != null) q = q.neq("id", excluirId)
    const { data, error } = await q.limit(1).maybeSingle()

    if (error) return { disponible: false, mensaje: error.message }
    if (data) return { disponible: false, mensaje: "Ya existe un mobiliario con ese nombre para este hotel." }
    return { disponible: true, mensaje: "Nombre disponible." }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { disponible: false, mensaje: "Error validando: " + msg }
  }
}

export type CrearMobiliarioPayload = {
  hotelid: number
  nombre: string
  descripcion: string
  costo: number | null
  activo: boolean
}

export async function crearMobiliario(
  payload: CrearMobiliarioPayload,
): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const nombre = (payload.nombre ?? "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }
    if (!payload.hotelid) return { success: false, error: "El hotel es obligatorio." }

    const hoy = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from("mobiliario")
      .insert({
        nombre,
        descripcion: (payload.descripcion ?? "").trim() || null,
        costo: payload.costo,
        activo: payload.activo,
        fechacreacion: hoy,
        hotelid: payload.hotelid,
      })
      .select("id")
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id as number }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error creando mobiliario: " + msg }
  }
}

const TABLAS_ELEMENTOS: Record<string, string> = {
  mobiliario: "mobiliario",
  platillos: "platillos",
  bebidas: "bebidas",
  servicios: "servicio",
  cortesias: "cortesias",
  beneficios: "beneficiosadicionales",
}

export async function actualizarMobiliario(
  id: number,
  payload: CrearMobiliarioPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const nombre = (payload.nombre ?? "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }
    if (!payload.hotelid) return { success: false, error: "El hotel es obligatorio." }

    const { error } = await supabase
      .from("mobiliario")
      .update({
        nombre,
        descripcion: (payload.descripcion ?? "").trim() || null,
        costo: payload.costo,
        activo: payload.activo,
        hotelid: payload.hotelid,
      })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error actualizando mobiliario: " + msg }
  }
}

export async function actualizarServicio(
  id: number,
  payload: CrearServicioPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const nombre = (payload.nombre ?? "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }
    if (!payload.hotelid) return { success: false, error: "El hotel es obligatorio." }

    const { error } = await supabase
      .from("servicio")
      .update({
        nombre,
        descripcion: (payload.descripcion ?? "").trim() || null,
        costo: payload.costo,
        activo: payload.activo,
        hotelid: payload.hotelid,
      })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error actualizando servicio: " + msg }
  }
}

export async function actualizarCortesia(
  id: number,
  payload: CrearCortesiaPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const nombre = (payload.nombre ?? "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }
    if (!payload.hotelid) return { success: false, error: "El hotel es obligatorio." }

    const { error } = await supabase
      .from("cortesias")
      .update({
        nombre,
        descripcion: (payload.descripcion ?? "").trim() || null,
        costo: payload.costo,
        activo: payload.activo,
        hotelid: payload.hotelid,
      })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error actualizando cortesía: " + msg }
  }
}

export async function actualizarBeneficio(
  id: number,
  payload: CrearBeneficioPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const nombre = (payload.nombre ?? "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }
    if (!payload.hotelid) return { success: false, error: "El hotel es obligatorio." }

    const { error } = await supabase
      .from("beneficiosadicionales")
      .update({
        nombre,
        descripcion: (payload.descripcion ?? "").trim() || null,
        costo: payload.costo,
        activo: payload.activo,
        hotelid: payload.hotelid,
      })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error actualizando beneficio: " + msg }
  }
}

export async function eliminarElemento(
  tipo: string,
  id: number,
  hotelid: number | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const tabla = TABLAS_ELEMENTOS[tipo]
    if (!tabla) return { success: false, error: `Tipo no soportado: ${tipo}` }

    let q = supabase.from(tabla).delete().eq("id", id)
    if (hotelid != null) q = q.eq("hotelid", hotelid)

    const { error } = await q
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error eliminando: " + msg }
  }
}

/**
 * Toggle del flag `activo` en la tabla del tipo indicado para el id dado.
 * Devuelve el nuevo valor de activo tras la actualización.
 */
export async function toggleActivoElemento(
  tipo: string,
  id: number,
): Promise<{ success: boolean; error?: string; activo?: boolean }> {
  try {
    const tabla = TABLAS_ELEMENTOS[tipo]
    if (!tabla) return { success: false, error: `Tipo no soportado: ${tipo}` }

    const { data: actual, error: eRead } = await supabase
      .from(tabla)
      .select("activo")
      .eq("id", id)
      .maybeSingle()
    if (eRead) return { success: false, error: eRead.message }
    if (!actual) return { success: false, error: "Registro no encontrado" }

    const nuevo = !(actual.activo === true)

    const { error: eUpd } = await supabase
      .from(tabla)
      .update({ activo: nuevo })
      .eq("id", id)
    if (eUpd) return { success: false, error: eUpd.message }

    return { success: true, activo: nuevo }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error actualizando activo: " + msg }
  }
}
