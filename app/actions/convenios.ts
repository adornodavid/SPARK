"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import type { oConvenio, oConvenioForm } from "@/types/convenios"
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
    - objetoConvenio / oConvenio (Individual)
    - objetoConvenios / oConvenios (Listado / Array)

  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearConvenio / insConvenio

  * SELECTS: READ/OBTENER/SELECT
    - obtenerConvenios / selConvenios
    - obtenerConvenio / selConvenio

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarConvenio / updConvenio

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarConvenio / delConvenio

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - renovarConvenio / renConvenio
    - actualizarEstadosVencidos / actEstadosVencidos
    - listaDesplegableConvenios / ddlConvenios
    - obtenerHistorialRenovaciones / selHistorialRenovaciones
================================================== */

/* ==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */

// Funcion: obtenerConvenios — Lista con filtros opcionales
export async function obtenerConvenios(filtros?: {
  hotelid?: number
  empresa?: string
  estado?: string
  busqueda?: string
}): Promise<{ success: boolean; error: string; data: oConvenio[] | null }> {
  try {
    let query = supabase.from("vw_oconvenios").select("*").eq("activo", true)

    if (filtros?.hotelid && filtros.hotelid !== -1) {
      query = query.eq("hotelid", filtros.hotelid)
    }
    if (filtros?.empresa && filtros.empresa.trim() !== "") {
      query = query.ilike("empresa", `%${filtros.empresa.trim()}%`)
    }
    if (filtros?.estado && filtros.estado !== "" && filtros.estado !== "todos") {
      query = query.eq("estado", filtros.estado)
    }
    if (filtros?.busqueda && filtros.busqueda.trim() !== "") {
      const term = filtros.busqueda.trim()
      query = query.or(`empresa.ilike.%${term}%,contacto.ilike.%${term}%,email.ilike.%${term}%`)
    }

    const { data, error } = await query.order("fechacreacion", { ascending: false }).limit(200)

    if (error) {
      return {
        success: false,
        error: "Error en obtenerConvenios: " + error.message,
        data: null,
      }
    }

    // Auto-calcular estado: si vigencia_fin < hoy y estado es activo -> vencido
    const hoy = new Date().toISOString().split("T")[0]
    const conveniosActualizados = (data || []).map((c: oConvenio) => {
      if (c.estado === "activo" && c.vigencia_fin < hoy) {
        return { ...c, estado: "vencido" as const }
      }
      return c
    })

    return { success: true, error: "", data: conveniosActualizados }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerConvenios: " + errorMessage, data: null }
  }
}

// Funcion: obtenerConvenio — Un solo convenio por ID
export async function obtenerConvenio(
  id: number,
): Promise<{ success: boolean; error: string; data: oConvenio | null }> {
  try {
    const { data, error } = await supabase
      .from("vw_oconvenios")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      return { success: false, error: "Error en obtenerConvenio: " + error.message, data: null }
    }

    if (!data) {
      return { success: false, error: "Convenio no encontrado", data: null }
    }

    // Auto-calcular estado
    const hoy = new Date().toISOString().split("T")[0]
    if (data.estado === "activo" && data.vigencia_fin < hoy) {
      data.estado = "vencido"
    }

    return { success: true, error: "", data: data as oConvenio }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerConvenio: " + errorMessage, data: null }
  }
}

/* ==================================================
  INSERTS: CREATE / CREAR / INSERT
================================================== */

// Funcion: crearConvenio — Inserta un nuevo convenio
export async function crearConvenio(
  datos: oConvenioForm,
): Promise<{ success: boolean; error: string; data: { id: number } | null }> {
  try {
    // Validaciones
    if (!datos.empresa || datos.empresa.trim().length < 2) {
      return { success: false, error: "El nombre de la empresa es requerido (min. 2 caracteres)", data: null }
    }
    if (!datos.vigencia_inicio || !datos.vigencia_fin) {
      return { success: false, error: "Las fechas de vigencia son requeridas", data: null }
    }
    if (datos.vigencia_fin < datos.vigencia_inicio) {
      return { success: false, error: "La fecha de fin no puede ser anterior a la fecha de inicio", data: null }
    }
    if (datos.descuento_valor <= 0) {
      return { success: false, error: "El valor del descuento debe ser mayor a 0", data: null }
    }
    if (datos.tipo_descuento === "porcentaje" && datos.descuento_valor > 100) {
      return { success: false, error: "El porcentaje de descuento no puede ser mayor a 100%", data: null }
    }

    // Determinar estado basado en vigencia
    const hoy = new Date().toISOString().split("T")[0]
    let estado = datos.estado || "activo"
    if (datos.vigencia_fin < hoy) {
      estado = "vencido"
    }

    // INSERT usa nombres reales de la BD (ingles) + columnas nuevas (espanol)
    const insertData = {
      company_name: datos.empresa.trim(),
      contact_name: datos.contacto?.trim() || null,
      contact_email: datos.email?.trim() || null,
      contact_phone: datos.telefono?.trim() || null,
      hotel_id: datos.hotelid || null,
      tipo_descuento: datos.tipo_descuento,
      descuento_valor: datos.descuento_valor,
      discount_percentage: datos.tipo_descuento === "porcentaje" ? datos.descuento_valor : null,
      aplica_a: datos.aplica_a,
      terms: datos.condiciones?.trim() || null,
      start_date: datos.vigencia_inicio,
      end_date: datos.vigencia_fin,
      status: estado,
      notes: datos.notas?.trim() || null,
      version: 1,
      activo: true,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("convenios")
      .insert(insertData)
      .select("id")
      .single()

    if (error) {
      return { success: false, error: "Error al crear convenio: " + error.message, data: null }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del convenio creado", data: null }
    }

    revalidatePath("/agreements")
    return { success: true, error: "", data: { id: data.id } }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno: " + errorMessage, data: null }
  }
}

/* ==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */

// Funcion: actualizarConvenio — Actualiza un convenio existente
export async function actualizarConvenio(
  id: number,
  datos: oConvenioForm,
): Promise<{ success: boolean; error: string }> {
  try {
    // Validaciones
    if (!datos.empresa || datos.empresa.trim().length < 2) {
      return { success: false, error: "El nombre de la empresa es requerido (min. 2 caracteres)" }
    }
    if (!datos.vigencia_inicio || !datos.vigencia_fin) {
      return { success: false, error: "Las fechas de vigencia son requeridas" }
    }
    if (datos.vigencia_fin < datos.vigencia_inicio) {
      return { success: false, error: "La fecha de fin no puede ser anterior a la fecha de inicio" }
    }
    if (datos.descuento_valor <= 0) {
      return { success: false, error: "El valor del descuento debe ser mayor a 0" }
    }
    if (datos.tipo_descuento === "porcentaje" && datos.descuento_valor > 100) {
      return { success: false, error: "El porcentaje de descuento no puede ser mayor a 100%" }
    }

    // Verificar existencia
    const { data: existente, error: errorExist } = await supabase
      .from("convenios")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExist || !existente) {
      return { success: false, error: "El convenio no existe" }
    }

    // Determinar estado basado en vigencia
    const hoy = new Date().toISOString().split("T")[0]
    let estado = datos.estado
    if (estado === "activo" && datos.vigencia_fin < hoy) {
      estado = "vencido"
    }

    // UPDATE usa nombres reales de la BD (ingles) + columnas nuevas (espanol)
    const updateData = {
      company_name: datos.empresa.trim(),
      contact_name: datos.contacto?.trim() || null,
      contact_email: datos.email?.trim() || null,
      contact_phone: datos.telefono?.trim() || null,
      hotel_id: datos.hotelid || null,
      tipo_descuento: datos.tipo_descuento,
      descuento_valor: datos.descuento_valor,
      discount_percentage: datos.tipo_descuento === "porcentaje" ? datos.descuento_valor : null,
      aplica_a: datos.aplica_a,
      terms: datos.condiciones?.trim() || null,
      start_date: datos.vigencia_inicio,
      end_date: datos.vigencia_fin,
      status: estado,
      notes: datos.notas?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("convenios").update(updateData).eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar: " + error.message }
    }

    revalidatePath("/agreements")
    revalidatePath(`/agreements/${id}`)
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno: " + errorMessage }
  }
}

/* ==================================================
  DELETES: DROP / ELIMINAR / DELETE
================================================== */

// Funcion: eliminarConvenio — Soft delete (marca activo = false)
export async function eliminarConvenio(
  id: number,
): Promise<{ success: boolean; error: string }> {
  try {
    const { data: existente, error: errorExist } = await supabase
      .from("convenios")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExist || !existente) {
      return { success: false, error: "El convenio no existe" }
    }

    const { error } = await supabase
      .from("convenios")
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar: " + error.message }
    }

    revalidatePath("/agreements")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno: " + errorMessage }
  }
}

/* ==================================================
  SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */

// Funcion: renovarConvenio — Crea nueva version basada en convenio existente
export async function renovarConvenio(
  id: number,
  nuevaVigenciaInicio: string,
  nuevaVigenciaFin: string,
): Promise<{ success: boolean; error: string; data: { id: number } | null }> {
  try {
    if (!nuevaVigenciaInicio || !nuevaVigenciaFin) {
      return { success: false, error: "Las nuevas fechas de vigencia son requeridas", data: null }
    }
    if (nuevaVigenciaFin < nuevaVigenciaInicio) {
      return { success: false, error: "La fecha de fin no puede ser anterior a la de inicio", data: null }
    }

    // Obtener convenio original
    const { data: original, error: errorGet } = await supabase
      .from("convenios")
      .select("*")
      .eq("id", id)
      .single()

    if (errorGet || !original) {
      return { success: false, error: "Convenio original no encontrado", data: null }
    }

    // Marcar el convenio anterior como vencido
    await supabase
      .from("convenios")
      .update({ status: "vencido", updated_at: new Date().toISOString() })
      .eq("id", id)

    // Crear nueva version (usa columnas reales de BD)
    const insertData = {
      company_name: original.company_name,
      contact_name: original.contact_name,
      contact_email: original.contact_email,
      contact_phone: original.contact_phone,
      hotel_id: original.hotel_id,
      tipo_descuento: original.tipo_descuento,
      descuento_valor: original.descuento_valor,
      discount_percentage: original.discount_percentage,
      aplica_a: original.aplica_a,
      terms: original.terms,
      start_date: nuevaVigenciaInicio,
      end_date: nuevaVigenciaFin,
      status: "activo",
      notes: original.notes,
      version: (original.version || 1) + 1,
      convenio_padre_id: original.convenio_padre_id || id,
      activo: true,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("convenios")
      .insert(insertData)
      .select("id")
      .single()

    if (error) {
      return { success: false, error: "Error al renovar: " + error.message, data: null }
    }

    revalidatePath("/agreements")
    revalidatePath(`/agreements/${id}`)
    return { success: true, error: "", data: { id: data.id } }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno: " + errorMessage, data: null }
  }
}

// Funcion: actualizarEstadosVencidos — Marca como vencidos los convenios con vigencia_fin < hoy
export async function actualizarEstadosVencidos(): Promise<{ success: boolean; error: string; actualizados: number }> {
  try {
    const hoy = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("convenios")
      .update({ status: "vencido", updated_at: new Date().toISOString() })
      .eq("status", "activo")
      .lt("end_date", hoy)
      .eq("activo", true)
      .select("id")

    if (error) {
      return { success: false, error: "Error actualizando estados: " + error.message, actualizados: 0 }
    }

    return { success: true, error: "", actualizados: data?.length || 0 }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno: " + errorMessage, actualizados: 0 }
  }
}

// Funcion: obtenerHistorialRenovaciones — Obtiene todas las versiones de un convenio
export async function obtenerHistorialRenovaciones(
  convenioId: number,
): Promise<{ success: boolean; error: string; data: oConvenio[] | null }> {
  try {
    // Primero obtener el convenio para saber su padre
    const { data: convenio, error: errorConvenio } = await supabase
      .from("convenios")
      .select("id, convenio_padre_id")
      .eq("id", convenioId)
      .maybeSingle()

    if (errorConvenio || !convenio) {
      return { success: false, error: "Convenio no encontrado", data: null }
    }

    // El ID raiz es el padre o el propio convenio si no tiene padre
    const raizId = convenio.convenio_padre_id || convenio.id

    // Buscar todas las versiones: el original + todas las renovaciones
    const { data, error } = await supabase
      .from("vw_oconvenios")
      .select("*")
      .or(`id.eq.${raizId},convenio_padre_id.eq.${raizId}`)
      .order("version", { ascending: true })

    if (error) {
      return { success: false, error: "Error obteniendo historial: " + error.message, data: null }
    }

    return { success: true, error: "", data: data as oConvenio[] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno: " + errorMessage, data: null }
  }
}

// Funcion: listaDesplegableConvenios — Para dropdownlist
export async function listaDesplegableConvenios(
  hotelid = -1,
): Promise<{ success: boolean; error: string; data: ddlItem[] }> {
  try {
    let query = supabase
      .from("convenios")
      .select("id, company_name")
      .eq("activo", true)
      .eq("status", "activo")

    if (hotelid !== -1) {
      query = query.eq("hotel_id", hotelid)
    }

    const { data, error } = await query.order("company_name", { ascending: true }).limit(100)

    if (error) {
      return { success: false, error: "Error obteniendo lista: " + error.message, data: [] }
    }

    const items: ddlItem[] = (data || []).map((c: any) => ({
      value: c.id.toString(),
      text: c.company_name,
    }))

    return { success: true, error: "", data: items }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error: " + errorMessage, data: [] }
  }
}
