"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import type { ddlItem } from "@/types/common"
import type { oPaquete } from "@/types/paquetes"
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
    - objetoPaquete / oPaquete (Individual)
    - objetoPaquetes / oPaquetes (Listado / Array)

  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearPaquete / insPaquete

  * SELECTS: READ/OBTENER/SELECT
    - obtenerPaquetes / selPaquetes
    - obtenerPaquete / selPaquete

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarPaquete / updPaquete

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarPaquete / delPaquete

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - estatusActivoPaquete / actPaquete
    - listaDesplegablePaquetes / ddlPaquetes
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Funcion: objetoPaquete / oPaquete (Individual)
export async function objetoPaquete(
  id = -1,
  nombre = "",
  hotelid = -1,
  tipo = "",
  activo = "Todos",
): Promise<{ success: boolean; error: string; data: oPaquete | null }> {
  try {
    let query = supabase.from("vw_opaquetes").select("*")

    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (tipo !== "") {
      query = query.eq("tipo", tipo)
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
      return {
        success: false,
        error: "Error en la funcion objetoPaquete de actions/paquetes: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oPaquete | null }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoPaquete: " + errorMessage, data: null }
  }
}

// Funcion: objetoPaquetes / oPaquetes (Listado / Array)
export async function objetoPaquetes(
  nombre = "",
  hotelid = -1,
  tipo = "",
  activo = "Todos",
): Promise<{ success: boolean; error: string; data: oPaquete[] | null }> {
  try {
    let query = supabase.from("vw_opaquetes").select("*")

    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (tipo !== "") {
      query = query.eq("tipo", tipo)
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

    const { data, error } = await query.order("nombre", { ascending: true })

    if (error) {
      return {
        success: false,
        error: "Error en la funcion objetoPaquetes de actions/paquetes: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oPaquete[] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoPaquetes: " + errorMessage, data: null }
  }
}

/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Funcion: crearPaquete / insPaquete
export async function crearPaquete(datos: {
  nombre: string
  descripcion?: string
  hotelid: number
  tipo: string
  preciobase: number
  precioporpersona: number
  minimopersonas: number
  maximopersonas?: number
  incluye: string[]
  vigenciainicio?: string
  vigenciafin?: string
  activo?: boolean
}): Promise<{ success: boolean; error: string; data: { id: number } | null }> {
  try {
    // Validaciones
    if (!datos.nombre || datos.nombre.trim().length < 2) {
      return { success: false, error: "El nombre del paquete es requerido (minimo 2 caracteres)", data: null }
    }
    if (!datos.hotelid) {
      return { success: false, error: "El hotel es requerido", data: null }
    }
    if (!datos.tipo) {
      return { success: false, error: "El tipo de paquete es requerido", data: null }
    }

    const insertData = {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      hotelid: datos.hotelid,
      tipo: datos.tipo,
      preciobase: datos.preciobase || 0,
      precioporpersona: datos.precioporpersona || 0,
      minimopersonas: datos.minimopersonas || 1,
      maximopersonas: datos.maximopersonas || null,
      incluye: datos.incluye || [],
      vigenciainicio: datos.vigenciainicio || null,
      vigenciafin: datos.vigenciafin || null,
      activo: datos.activo !== undefined ? datos.activo : true,
      fechacreacion: new Date().toISOString(),
      fechaactualizacion: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("paquetes")
      .insert(insertData)
      .select("id")
      .single()

    if (error) {
      return { success: false, error: "Error al crear paquete: " + error.message, data: null }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del paquete creado", data: null }
    }

    revalidatePath("/packages")
    return { success: true, error: "", data: { id: data.id } }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno: " + errorMessage, data: null }
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Funcion: obtenerPaquetes / selPaquetes
export async function obtenerPaquetes(filtros?: {
  hotelid?: number
  tipo?: string
  activo?: string
  busqueda?: string
  soloVigentes?: boolean
}): Promise<{ success: boolean; error: string; data: oPaquete[] | null }> {
  try {
    let query = supabase.from("vw_opaquetes").select("*")

    if (filtros?.hotelid && filtros.hotelid !== -1) {
      query = query.eq("hotelid", filtros.hotelid)
    }
    if (filtros?.tipo && filtros.tipo !== "" && filtros.tipo !== "Todos") {
      query = query.eq("tipo", filtros.tipo)
    }
    if (filtros?.busqueda && filtros.busqueda.trim() !== "") {
      query = query.ilike("nombre", `%${filtros.busqueda.trim()}%`)
    }
    if (filtros?.activo && filtros.activo !== "Todos") {
      const isActive = ["True", "true", "Activo", "1"].includes(filtros.activo)
      if (isActive) {
        query = query.eq("activo", true)
      } else {
        query = query.eq("activo", false)
      }
    }
    if (filtros?.soloVigentes) {
      const hoy = new Date().toISOString().split("T")[0]
      query = query.or(`vigenciainicio.is.null,vigenciainicio.lte.${hoy}`)
      query = query.or(`vigenciafin.is.null,vigenciafin.gte.${hoy}`)
    }

    const { data, error } = await query.order("hotelid", { ascending: true }).order("nombre", { ascending: true })

    if (error) {
      return { success: false, error: "Error obteniendo paquetes: " + error.message, data: null }
    }

    return { success: true, error: "", data: data as oPaquete[] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerPaquetes: " + errorMessage, data: null }
  }
}

// Funcion: obtenerPaquete / selPaquete (individual por ID)
export async function obtenerPaquete(
  id: number,
): Promise<{ success: boolean; error: string; data: oPaquete | null }> {
  try {
    const { data, error } = await supabase
      .from("vw_opaquetes")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      return { success: false, error: "Error obteniendo paquete: " + error.message, data: null }
    }

    if (!data) {
      return { success: false, error: "Paquete no encontrado", data: null }
    }

    return { success: true, error: "", data: data as oPaquete }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error: " + errorMessage, data: null }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Funcion: actualizarPaquete / updPaquete
export async function actualizarPaquete(
  id: number,
  datos: {
    nombre: string
    descripcion?: string
    hotelid: number
    tipo: string
    preciobase: number
    precioporpersona: number
    minimopersonas: number
    maximopersonas?: number
    incluye: string[]
    vigenciainicio?: string
    vigenciafin?: string
    activo?: boolean
  },
): Promise<{ success: boolean; error: string }> {
  try {
    // Validaciones
    if (!datos.nombre || datos.nombre.trim().length < 2) {
      return { success: false, error: "El nombre del paquete es requerido (minimo 2 caracteres)" }
    }
    if (!datos.hotelid) {
      return { success: false, error: "El hotel es requerido" }
    }

    // Verificar existencia
    const { data: existente, error: errorExistencia } = await supabase
      .from("paquetes")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      return { success: false, error: "Error validando existencia del paquete: " + errorExistencia.message }
    }
    if (!existente) {
      return { success: false, error: "El paquete con el id proporcionado no existe" }
    }

    const updateData = {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      hotelid: datos.hotelid,
      tipo: datos.tipo,
      preciobase: datos.preciobase || 0,
      precioporpersona: datos.precioporpersona || 0,
      minimopersonas: datos.minimopersonas || 1,
      maximopersonas: datos.maximopersonas || null,
      incluye: datos.incluye || [],
      vigenciainicio: datos.vigenciainicio || null,
      vigenciafin: datos.vigenciafin || null,
      activo: datos.activo !== undefined ? datos.activo : true,
      fechaactualizacion: new Date().toISOString(),
    }

    const { error } = await supabase.from("paquetes").update(updateData).eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar paquete: " + error.message }
    }

    revalidatePath("/packages")
    revalidatePath(`/packages/${id}`)
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno: " + errorMessage }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Funcion: eliminarPaquete / delPaquete (soft delete - cambia activo a false)
export async function eliminarPaquete(
  id: number,
): Promise<{ success: boolean; error: string }> {
  try {
    // Verificar existencia
    const { data: existente, error: errorExistencia } = await supabase
      .from("paquetes")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      return { success: false, error: "Error validando existencia del paquete: " + errorExistencia.message }
    }
    if (!existente) {
      return { success: false, error: "El paquete con el id proporcionado no existe" }
    }

    // Soft delete
    const { error } = await supabase
      .from("paquetes")
      .update({ activo: false, fechaactualizacion: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar paquete: " + error.message }
    }

    revalidatePath("/packages")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno: " + errorMessage }
  }
}

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Funcion: estatusActivoPaquete / actPaquete
export async function estatusActivoPaquete(
  id: number,
  activo: boolean,
): Promise<{ success: boolean; error: string }> {
  try {
    const { data: existente, error: errorExistencia } = await supabase
      .from("paquetes")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      return { success: false, error: "Error validando existencia del paquete: " + errorExistencia.message }
    }
    if (!existente) {
      return { success: false, error: "El paquete con el id proporcionado no existe" }
    }

    const { error } = await supabase
      .from("paquetes")
      .update({ activo, fechaactualizacion: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/packages")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error interno del servidor: " + errorMessage }
  }
}

// Funcion: listaDesplegablePaquetes / ddlPaquetes
export async function listaDesplegablePaquetes(
  hotelid = -1,
  tipo = "",
): Promise<{ success: boolean; error: string; data?: ddlItem[] }> {
  try {
    let query = supabase
      .from("paquetes")
      .select("id, nombre")
      .eq("activo", true)

    if (hotelid !== -1) {
      query = query.eq("hotelid", hotelid)
    }
    if (tipo !== "") {
      query = query.eq("tipo", tipo)
    }

    query = query.order("nombre", { ascending: true }).limit(100)

    const { data: paquetes, error } = await query

    if (error) {
      return { success: false, error: "Error obteniendo lista de paquetes: " + error.message }
    }

    if (!paquetes || paquetes.length === 0) {
      return { success: true, error: "", data: [] }
    }

    const data: ddlItem[] = paquetes.map((paquete) => ({
      value: paquete.id.toString(),
      text: paquete.nombre,
    }))

    return { success: true, error: "", data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo lista desplegable de paquetes: " + errorMessage }
  }
}
