"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import type {
  oHabitacion,
  oHabitacionDetalle,
  oCategoriaHabitacion,
  oCategoriaHabitacionDetalle,
  EstadoHabitacion,
  ddlHotel,
  ddlCategoria,
} from "@/types/habitaciones"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  --------------------
  Funciones Habitaciones
  --------------------
  * HABITACIONES
    - obtenerHabitaciones(hotelId?, categoryId?, status?, search?)
    - obtenerHabitacion(id)
    - crearHabitacion(data)
    - actualizarHabitacion(id, data)
    - eliminarHabitacion(id)

  * CATEGORIAS
    - obtenerCategoriasHabitacion(hotelId?)
    - obtenerCategoriaHabitacion(id)
    - crearCategoriaHabitacion(data)
    - actualizarCategoriaHabitacion(id, data)
    - eliminarCategoriaHabitacion(id)

  * DROPDOWNS
    - ddlHoteles()
    - ddlCategorias(hotelId?)
    - obtenerEstadisticasHabitaciones(hotelId?)
================================================== */

/* ==================================================
  HABITACIONES: obtenerHabitaciones
================================================== */
export async function obtenerHabitaciones(
  hotelId?: string,
  categoryId?: string,
  status?: EstadoHabitacion,
  search?: string
): Promise<{ success: boolean; error: string; data: oHabitacionDetalle[] }> {
  try {
    let query = supabase
      .from("rooms")
      .select(`
        *,
        hotel:hotels(name, code),
        room_categories(id, name, base_price, max_occupancy)
      `)
      .order("hotel_id")
      .order("room_number")

    if (hotelId && hotelId !== "all") {
      query = query.eq("hotel_id", hotelId)
    }
    if (categoryId && categoryId !== "all") {
      query = query.eq("category_id", categoryId)
    }
    if (status && status !== ("all" as EstadoHabitacion)) {
      query = query.eq("status", status)
    }
    if (search && search.trim() !== "") {
      query = query.or(`room_number.ilike.%${search}%,description.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en obtenerHabitaciones: " + error.message,
        data: [],
      }
    }

    return { success: true, error: "", data: (data as oHabitacionDetalle[]) || [] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerHabitaciones: " + errorMessage, data: [] }
  }
}

/* ==================================================
  HABITACIONES: obtenerHabitacion (single)
================================================== */
export async function obtenerHabitacion(
  id: string
): Promise<{ success: boolean; error: string; data: oHabitacionDetalle | null }> {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select(`
        *,
        hotel:hotels(name, code),
        room_categories(id, name, base_price, max_occupancy)
      `)
      .eq("id", id)
      .single()

    if (error) {
      return {
        success: false,
        error: "Error en obtenerHabitacion: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oHabitacionDetalle }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerHabitacion: " + errorMessage, data: null }
  }
}

/* ==================================================
  HABITACIONES: crearHabitacion
================================================== */
export async function crearHabitacion(formData: {
  hotel_id: string
  category_id: string
  room_number: string
  floor?: number | null
  status?: EstadoHabitacion
  capacity?: number | null
  rack_price?: number | null
  description?: string
  amenities?: string[]
  notes?: string
}): Promise<{ success: boolean; error: string; data: oHabitacion | null }> {
  try {
    // Validaciones
    if (!formData.hotel_id) {
      return { success: false, error: "El hotel es obligatorio", data: null }
    }
    if (!formData.room_number || formData.room_number.trim() === "") {
      return { success: false, error: "El numero de habitacion es obligatorio", data: null }
    }

    // Verificar duplicado
    const { data: existente } = await supabase
      .from("rooms")
      .select("id")
      .eq("hotel_id", formData.hotel_id)
      .eq("room_number", formData.room_number.trim())
      .maybeSingle()

    if (existente) {
      return {
        success: false,
        error: `Ya existe la habitacion ${formData.room_number} en este hotel`,
        data: null,
      }
    }

    const dataToInsert = {
      hotel_id: formData.hotel_id,
      category_id: formData.category_id || null,
      room_number: formData.room_number.trim(),
      floor: formData.floor ?? null,
      status: formData.status || "disponible",
      capacity: formData.capacity ?? null,
      rack_price: formData.rack_price ?? null,
      description: formData.description?.trim() || null,
      amenities: formData.amenities && formData.amenities.length > 0
        ? JSON.stringify(formData.amenities)
        : null,
      notes: formData.notes?.trim() || null,
      is_available: formData.status !== "fuera_de_servicio",
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert(dataToInsert)
      .select()
      .single()

    if (error) {
      return { success: false, error: "Error al crear habitacion: " + error.message, data: null }
    }

    revalidatePath("/habitaciones")
    return { success: true, error: "", data: data as oHabitacion }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en crearHabitacion: " + errorMessage, data: null }
  }
}

/* ==================================================
  HABITACIONES: actualizarHabitacion
================================================== */
export async function actualizarHabitacion(
  id: string,
  formData: {
    hotel_id?: string
    category_id?: string
    room_number?: string
    floor?: number | null
    status?: EstadoHabitacion
    capacity?: number | null
    rack_price?: number | null
    description?: string
    amenities?: string[]
    notes?: string
  }
): Promise<{ success: boolean; error: string }> {
  try {
    // Verificar existencia
    const { data: existente } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (!existente) {
      return { success: false, error: "La habitacion no existe" }
    }

    // Verificar duplicado si cambia numero
    if (formData.room_number && formData.hotel_id) {
      const { data: duplicado } = await supabase
        .from("rooms")
        .select("id")
        .eq("hotel_id", formData.hotel_id)
        .eq("room_number", formData.room_number.trim())
        .neq("id", id)
        .maybeSingle()

      if (duplicado) {
        return {
          success: false,
          error: `Ya existe la habitacion ${formData.room_number} en este hotel`,
        }
      }
    }

    const dataToUpdate: Record<string, unknown> = {}

    if (formData.hotel_id !== undefined) dataToUpdate.hotel_id = formData.hotel_id
    if (formData.category_id !== undefined) dataToUpdate.category_id = formData.category_id || null
    if (formData.room_number !== undefined) dataToUpdate.room_number = formData.room_number.trim()
    if (formData.floor !== undefined) dataToUpdate.floor = formData.floor
    if (formData.status !== undefined) {
      dataToUpdate.status = formData.status
      dataToUpdate.is_available = formData.status !== "fuera_de_servicio"
    }
    if (formData.capacity !== undefined) dataToUpdate.capacity = formData.capacity
    if (formData.rack_price !== undefined) dataToUpdate.rack_price = formData.rack_price
    if (formData.description !== undefined) dataToUpdate.description = formData.description.trim() || null
    if (formData.amenities !== undefined) {
      dataToUpdate.amenities = formData.amenities.length > 0
        ? JSON.stringify(formData.amenities)
        : null
    }
    if (formData.notes !== undefined) dataToUpdate.notes = formData.notes.trim() || null

    dataToUpdate.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from("rooms")
      .update(dataToUpdate)
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar habitacion: " + error.message }
    }

    revalidatePath("/habitaciones")
    revalidatePath(`/habitaciones/${id}`)
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarHabitacion: " + errorMessage }
  }
}

/* ==================================================
  HABITACIONES: eliminarHabitacion
================================================== */
export async function eliminarHabitacion(
  id: string
): Promise<{ success: boolean; error: string }> {
  try {
    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar habitacion: " + error.message }
    }

    revalidatePath("/habitaciones")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en eliminarHabitacion: " + errorMessage }
  }
}

/* ==================================================
  CATEGORIAS: obtenerCategoriasHabitacion
================================================== */
export async function obtenerCategoriasHabitacion(
  hotelId?: string
): Promise<{ success: boolean; error: string; data: oCategoriaHabitacionDetalle[] }> {
  try {
    let query = supabase
      .from("room_categories")
      .select(`
        *,
        hotel:hotels(name, code)
      `)
      .order("hotel_id", { ascending: true })
      .order("name", { ascending: true })

    if (hotelId && hotelId !== "all") {
      query = query.eq("hotel_id", hotelId)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en obtenerCategoriasHabitacion: " + error.message,
        data: [],
      }
    }

    // Get room counts per category
    const { data: roomCounts } = await supabase
      .from("rooms")
      .select("category_id")

    const countMap: Record<string, number> = {}
    if (roomCounts) {
      for (const r of roomCounts) {
        if (r.category_id) {
          countMap[r.category_id] = (countMap[r.category_id] || 0) + 1
        }
      }
    }

    const categoriesWithCount = (data || []).map((cat: oCategoriaHabitacionDetalle) => ({
      ...cat,
      _count: { rooms: countMap[cat.id] || 0 },
    }))

    return { success: true, error: "", data: categoriesWithCount }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerCategoriasHabitacion: " + errorMessage, data: [] }
  }
}

/* ==================================================
  CATEGORIAS: obtenerCategoriaHabitacion (single)
================================================== */
export async function obtenerCategoriaHabitacion(
  id: string
): Promise<{ success: boolean; error: string; data: oCategoriaHabitacionDetalle | null }> {
  try {
    const { data, error } = await supabase
      .from("room_categories")
      .select(`
        *,
        hotel:hotels(name, code)
      `)
      .eq("id", id)
      .single()

    if (error) {
      return {
        success: false,
        error: "Error en obtenerCategoriaHabitacion: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oCategoriaHabitacionDetalle }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerCategoriaHabitacion: " + errorMessage, data: null }
  }
}

/* ==================================================
  CATEGORIAS: crearCategoriaHabitacion
================================================== */
export async function crearCategoriaHabitacion(formData: {
  hotel_id: string
  name: string
  description?: string
  base_price?: number | null
  max_occupancy?: number | null
  amenities?: string[]
}): Promise<{ success: boolean; error: string; data: oCategoriaHabitacion | null }> {
  try {
    if (!formData.hotel_id) {
      return { success: false, error: "El hotel es obligatorio", data: null }
    }
    if (!formData.name || formData.name.trim() === "") {
      return { success: false, error: "El nombre de la categoria es obligatorio", data: null }
    }

    // Verificar duplicado
    const { data: existente } = await supabase
      .from("room_categories")
      .select("id")
      .eq("hotel_id", formData.hotel_id)
      .ilike("name", formData.name.trim())
      .maybeSingle()

    if (existente) {
      return {
        success: false,
        error: `Ya existe la categoria "${formData.name}" en este hotel`,
        data: null,
      }
    }

    const dataToInsert = {
      hotel_id: formData.hotel_id,
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      base_price: formData.base_price ?? null,
      max_occupancy: formData.max_occupancy ?? null,
      amenities: formData.amenities && formData.amenities.length > 0
        ? JSON.stringify(formData.amenities.reduce((acc: Record<string, boolean>, a: string) => ({ ...acc, [a]: true }), {}))
        : null,
    }

    const { data, error } = await supabase
      .from("room_categories")
      .insert(dataToInsert)
      .select()
      .single()

    if (error) {
      return { success: false, error: "Error al crear categoria: " + error.message, data: null }
    }

    revalidatePath("/room-categories")
    return { success: true, error: "", data: data as oCategoriaHabitacion }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en crearCategoriaHabitacion: " + errorMessage, data: null }
  }
}

/* ==================================================
  CATEGORIAS: actualizarCategoriaHabitacion
================================================== */
export async function actualizarCategoriaHabitacion(
  id: string,
  formData: {
    hotel_id?: string
    name?: string
    description?: string
    base_price?: number | null
    max_occupancy?: number | null
    amenities?: string[]
  }
): Promise<{ success: boolean; error: string }> {
  try {
    const { data: existente } = await supabase
      .from("room_categories")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (!existente) {
      return { success: false, error: "La categoria no existe" }
    }

    // Verificar duplicado nombre
    if (formData.name && formData.hotel_id) {
      const { data: duplicado } = await supabase
        .from("room_categories")
        .select("id")
        .eq("hotel_id", formData.hotel_id)
        .ilike("name", formData.name.trim())
        .neq("id", id)
        .maybeSingle()

      if (duplicado) {
        return {
          success: false,
          error: `Ya existe la categoria "${formData.name}" en este hotel`,
        }
      }
    }

    const dataToUpdate: Record<string, unknown> = {}

    if (formData.hotel_id !== undefined) dataToUpdate.hotel_id = formData.hotel_id
    if (formData.name !== undefined) dataToUpdate.name = formData.name.trim()
    if (formData.description !== undefined) dataToUpdate.description = formData.description.trim() || null
    if (formData.base_price !== undefined) dataToUpdate.base_price = formData.base_price
    if (formData.max_occupancy !== undefined) dataToUpdate.max_occupancy = formData.max_occupancy
    if (formData.amenities !== undefined) {
      dataToUpdate.amenities = formData.amenities.length > 0
        ? JSON.stringify(formData.amenities.reduce((acc: Record<string, boolean>, a: string) => ({ ...acc, [a]: true }), {}))
        : null
    }

    dataToUpdate.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from("room_categories")
      .update(dataToUpdate)
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar categoria: " + error.message }
    }

    revalidatePath("/room-categories")
    revalidatePath(`/room-categories/${id}`)
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarCategoriaHabitacion: " + errorMessage }
  }
}

/* ==================================================
  CATEGORIAS: eliminarCategoriaHabitacion
================================================== */
export async function eliminarCategoriaHabitacion(
  id: string
): Promise<{ success: boolean; error: string }> {
  try {
    // Verificar si tiene habitaciones asociadas
    const { data: roomsWithCategory } = await supabase
      .from("rooms")
      .select("id")
      .eq("category_id", id)
      .limit(1)

    if (roomsWithCategory && roomsWithCategory.length > 0) {
      return {
        success: false,
        error: "No se puede eliminar la categoria porque tiene habitaciones asociadas. Reasigna las habitaciones primero.",
      }
    }

    const { error } = await supabase
      .from("room_categories")
      .delete()
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar categoria: " + error.message }
    }

    revalidatePath("/room-categories")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en eliminarCategoriaHabitacion: " + errorMessage }
  }
}

/* ==================================================
  DROPDOWNS: ddlHoteles
================================================== */
export async function ddlHotelesHabitaciones(): Promise<{
  success: boolean
  error: string
  data: ddlHotel[]
}> {
  try {
    const { data, error } = await supabase
      .from("hotels")
      .select("id, code, name")
      .eq("status", "active")
      .order("name")

    if (error) {
      // Intentar con hoteles table (Spanish) si hotels falla
      const { data: dataEs, error: errorEs } = await supabase
        .from("hoteles")
        .select("id, acronimo, nombre")
        .eq("activo", true)
        .order("nombre")

      if (errorEs) {
        return { success: false, error: "Error obteniendo hoteles: " + errorEs.message, data: [] }
      }

      const mapped = (dataEs || []).map((h: Record<string, unknown>) => ({
        id: String(h.id),
        code: String(h.acronimo || ""),
        name: String(h.nombre || ""),
      }))

      return { success: true, error: "", data: mapped }
    }

    return { success: true, error: "", data: (data as ddlHotel[]) || [] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en ddlHotelesHabitaciones: " + errorMessage, data: [] }
  }
}

/* ==================================================
  DROPDOWNS: ddlCategorias
================================================== */
export async function ddlCategoriasHabitacion(
  hotelId?: string
): Promise<{ success: boolean; error: string; data: ddlCategoria[] }> {
  try {
    let query = supabase
      .from("room_categories")
      .select("id, name, hotel_id")
      .order("name")

    if (hotelId && hotelId !== "all") {
      query = query.eq("hotel_id", hotelId)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: "Error obteniendo categorias: " + error.message, data: [] }
    }

    return { success: true, error: "", data: (data as ddlCategoria[]) || [] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en ddlCategoriasHabitacion: " + errorMessage, data: [] }
  }
}

/* ==================================================
  ESTADISTICAS: obtenerEstadisticasHabitaciones
================================================== */
export async function obtenerEstadisticasHabitaciones(
  hotelId?: string
): Promise<{
  success: boolean
  error: string
  data: {
    total: number
    disponibles: number
    ocupadas: number
    mantenimiento: number
    fueraDeServicio: number
    categorias: number
  }
}> {
  try {
    let query = supabase.from("rooms").select("id, status")

    if (hotelId && hotelId !== "all") {
      query = query.eq("hotel_id", hotelId)
    }

    const { data: rooms, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error obteniendo estadisticas: " + error.message,
        data: { total: 0, disponibles: 0, ocupadas: 0, mantenimiento: 0, fueraDeServicio: 0, categorias: 0 },
      }
    }

    let catQuery = supabase.from("room_categories").select("id")
    if (hotelId && hotelId !== "all") {
      catQuery = catQuery.eq("hotel_id", hotelId)
    }
    const { data: cats } = await catQuery

    const stats = {
      total: rooms?.length || 0,
      disponibles: rooms?.filter((r) => r.status === "disponible").length || 0,
      ocupadas: rooms?.filter((r) => r.status === "ocupada").length || 0,
      mantenimiento: rooms?.filter((r) => r.status === "mantenimiento").length || 0,
      fueraDeServicio: rooms?.filter((r) => r.status === "fuera_de_servicio").length || 0,
      categorias: cats?.length || 0,
    }

    return { success: true, error: "", data: stats }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error en obtenerEstadisticasHabitaciones: " + errorMessage,
      data: { total: 0, disponibles: 0, ocupadas: 0, mantenimiento: 0, fueraDeServicio: 0, categorias: 0 },
    }
  }
}
