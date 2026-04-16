"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Inserta en empresas todos los pip_organizations que aún no existan
 * (comparando por pipedrive_id). Invoca la función SQL transferir_nuevos_pip_a_empresas.
 */
export async function transferirNuevasEmpresasDesdePipedrive() {
  try {
    const { data, error } = await supabase.rpc("transferir_nuevos_pip_a_empresas")
    if (error) return { success: false, error: error.message }
    const row = Array.isArray(data) ? data[0] : data
    revalidatePath("/empresas")
    return { success: true, insertados: row?.insertados ?? 0 }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error transfiriendo empresas desde Pipedrive: " + msg }
  }
}

/**
 * Placeholder: actualiza empresas existentes (con pipedrive_id) con datos
 * frescos de pip_organizations. Campos a actualizar por definir.
 */
export async function actualizarEmpresasDesdePipedrive() {
  return { success: false, error: "Pendiente: definir campos a actualizar." }
}

export type EmpresaSugerencia = { id: number; nombre: string }

export async function listarEmpresasPaginado(
  search: string = "",
  page: number = 1,
  pageSize: number = 50,
) {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from("empresas")
      .select("id, nombre, direccion, email, telefono", { count: "exact" })

    const s = (search || "").trim()
    if (s) {
      const asNum = Number(s)
      if (!Number.isNaN(asNum) && /^\d+$/.test(s)) {
        q = q.eq("id", asNum)
      } else {
        q = q.or(
          `nombre.ilike.%${s}%,direccion.ilike.%${s}%,email.ilike.%${s}%,telefono.ilike.%${s}%`,
        )
      }
    }

    const { data, error, count } = await q.order("id", { ascending: false }).range(from, to)
    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [], total: count || 0 }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error listando empresas: " + msg }
  }
}

export type CrearEmpresaPayload = {
  nombre: string
  descripcion: string
  direccion: string
  email: string
  telefono: string
  contactoclienteid: number | null
}

export async function crearEmpresaNueva(payload: CrearEmpresaPayload) {
  try {
    const nombre = (payload.nombre || "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }

    const { data: dup } = await supabase
      .from("empresas")
      .select("id")
      .ilike("nombre", nombre)
      .limit(1)
      .maybeSingle()
    if (dup) return { success: false, error: `Ya existe una empresa con el nombre "${nombre}".` }

    const ahora = new Date().toISOString()
    const { data, error } = await supabase
      .from("empresas")
      .insert({
        nombre,
        descripcion: (payload.descripcion || "").trim() || null,
        direccion: (payload.direccion || "").trim() || null,
        email: (payload.email || "").trim().toLowerCase() || null,
        telefono: (payload.telefono || "").trim() || null,
        contactoclienteid: payload.contactoclienteid,
        activo: true,
        fechacreacion: ahora,
        fechamodificacion: ahora,
      })
      .select("id")
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath("/empresas")
    return { success: true, id: data?.id as number }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error creando empresa: " + msg }
  }
}

export type EmpresaDetalle = {
  id: number
  nombre: string
  descripcion: string | null
  direccion: string | null
  email: string | null
  telefono: string | null
  contactoclienteid: number | null
  contacto_nombre: string | null
}

export async function obtenerEmpresa(id: number) {
  try {
    const { data: empresa, error } = await supabase
      .from("empresas")
      .select("id, nombre, descripcion, direccion, email, telefono, contactoclienteid")
      .eq("id", id)
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    if (!empresa) return { success: false, error: "Empresa no encontrada." }

    let contacto_nombre: string | null = null
    if (empresa.contactoclienteid) {
      const { data: c } = await supabase
        .from("clientes")
        .select("nombre, apellidos")
        .eq("id", empresa.contactoclienteid)
        .maybeSingle()
      if (c) {
        const partes = [(c as { nombre?: string }).nombre, (c as { apellidos?: string }).apellidos]
          .filter(Boolean)
          .join(" ")
          .trim()
        contacto_nombre = partes || null
      }
    }
    return { success: true, data: { ...empresa, contacto_nombre } as EmpresaDetalle }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo empresa: " + msg }
  }
}

export type ActualizarEmpresaPayload = {
  descripcion: string
  direccion: string
  email: string
  telefono: string
  contactoclienteid: number | null
}

export async function actualizarEmpresa(id: number, payload: ActualizarEmpresaPayload) {
  try {
    const { error } = await supabase
      .from("empresas")
      .update({
        descripcion: (payload.descripcion || "").trim() || null,
        direccion: (payload.direccion || "").trim() || null,
        email: (payload.email || "").trim().toLowerCase() || null,
        telefono: (payload.telefono || "").trim() || null,
        contactoclienteid: payload.contactoclienteid,
        fechamodificacion: new Date().toISOString(),
      })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/empresas")
    revalidatePath(`/empresas/ver/${id}`)
    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error actualizando empresa: " + msg }
  }
}

export async function buscarEmpresasPorNombre(termino: string): Promise<EmpresaSugerencia[]> {
  const q = (termino || "").trim()
  if (q.length < 2) return []
  const { data, error } = await supabase
    .from("empresas")
    .select("id, nombre")
    .ilike("nombre", `%${q}%`)
    .order("nombre", { ascending: true })
    .limit(20)
  if (error) {
    console.error("Error buscando empresas:", error.message)
    return []
  }
  return (data as EmpresaSugerencia[]) || []
}
