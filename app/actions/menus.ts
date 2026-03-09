"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import type { oCategoriaMenu, oItemMenu, oCategoriaConItems } from "@/types/menus"

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
    - oCategoriaMenu (Individual)
    - oItemMenu (Individual)

  --------------------
  Funciones
  --------------------
  * SELECTS: READ/OBTENER/SELECT
    - obtenerMenus / selMenus
    - obtenerCategoriaMenu / selCategoriaMenu
    - obtenerItemMenu / selItemMenu
    - obtenerCategoriasDropdown / ddlCategorias

  * INSERTS: CREATE/CREAR/INSERT
    - crearCategoriaMenu / insCategoriaMenu
    - crearItemMenu / insItemMenu

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarCategoriaMenu / updCategoriaMenu
    - actualizarItemMenu / updItemMenu
    - toggleDisponibleItem / actDisponibleItem

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarCategoriaMenu / delCategoriaMenu
    - eliminarItemMenu / delItemMenu
================================================== */

/* ==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */

// Funcion: obtenerMenus - Obtiene todas las categorias con sus items y conteos
export async function obtenerMenus(
  hotelId?: number,
  busqueda?: string,
): Promise<{ success: boolean; error: string; data: oCategoriaConItems[] | null }> {
  try {
    // Obtener categorias
    let catQuery = supabase
      .from("menu_categories")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true })

    if (hotelId && hotelId !== -1) {
      catQuery = catQuery.or(`hotelid.eq.${hotelId},hotelid.is.null`)
    }

    const { data: categorias, error: catError } = await catQuery

    if (catError) {
      return { success: false, error: "Error obteniendo categorias: " + catError.message, data: null }
    }

    if (!categorias || categorias.length === 0) {
      return { success: true, error: "", data: [] }
    }

    // Obtener items
    let itemQuery = supabase
      .from("menu_items")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true })

    if (hotelId && hotelId !== -1) {
      itemQuery = itemQuery.or(`hotelid.eq.${hotelId},hotelid.is.null`)
    }

    if (busqueda && busqueda.trim() !== "") {
      const term = busqueda.trim()
      itemQuery = itemQuery.or(`nombre.ilike.%${term}%,descripcion.ilike.%${term}%`)
    }

    const { data: items, error: itemError } = await itemQuery

    if (itemError) {
      return { success: false, error: "Error obteniendo items: " + itemError.message, data: null }
    }

    // Obtener nombres de hoteles
    const { data: hoteles } = await supabase
      .from("hoteles")
      .select("id, nombre")
      .eq("activo", true)

    const hotelesMap = new Map<number, string>()
    if (hoteles) {
      hoteles.forEach((h) => hotelesMap.set(h.id, h.nombre))
    }

    // Agrupar items por categoria
    const result: oCategoriaConItems[] = categorias.map((cat) => {
      const catItems = (items || []).filter((item) => item.categoriaid === cat.id)
      const precios = catItems.filter((i) => i.precio > 0).map((i) => i.precio)

      return {
        id: cat.id,
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        orden: cat.orden || 0,
        hotelid: cat.hotelid,
        hotelnombre: cat.hotelid ? hotelesMap.get(cat.hotelid) || "" : undefined,
        activo: cat.activo,
        fechacreacion: cat.fechacreacion,
        totalitems: catItems.length,
        items: catItems.map((item) => ({
          id: item.id,
          nombre: item.nombre,
          descripcion: item.descripcion,
          precio: item.precio || 0,
          categoriaid: item.categoriaid,
          hotelid: item.hotelid,
          hotelnombre: item.hotelid ? hotelesMap.get(item.hotelid) || "" : undefined,
          disponible: item.disponible ?? true,
          imagenurl: item.imagenurl,
          alergenos: item.alergenos,
          orden: item.orden || 0,
          activo: item.activo,
        })),
        preciomin: precios.length > 0 ? Math.min(...precios) : 0,
        preciomax: precios.length > 0 ? Math.max(...precios) : 0,
      }
    })

    // Si hay busqueda, filtrar categorias que tengan items coincidentes
    if (busqueda && busqueda.trim() !== "") {
      return {
        success: true,
        error: "",
        data: result.filter((cat) => cat.items.length > 0),
      }
    }

    return { success: true, error: "", data: result }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerMenus: " + errorMessage, data: null }
  }
}

// Funcion: obtenerCategoriaMenu - Obtiene una categoria con todos sus items
export async function obtenerCategoriaMenu(
  id: number,
): Promise<{ success: boolean; error: string; data: oCategoriaConItems | null }> {
  try {
    const { data: cat, error: catError } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (catError) {
      return { success: false, error: "Error obteniendo categoria: " + catError.message, data: null }
    }

    if (!cat) {
      return { success: false, error: "Categoria no encontrada", data: null }
    }

    // Obtener items de esta categoria
    const { data: items, error: itemError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("categoriaid", id)
      .eq("activo", true)
      .order("orden", { ascending: true })

    if (itemError) {
      return { success: false, error: "Error obteniendo items: " + itemError.message, data: null }
    }

    // Obtener nombre del hotel si aplica
    let hotelnombre: string | undefined
    if (cat.hotelid) {
      const { data: hotel } = await supabase
        .from("hoteles")
        .select("nombre")
        .eq("id", cat.hotelid)
        .maybeSingle()
      hotelnombre = hotel?.nombre
    }

    const itemsMapped: oItemMenu[] = (items || []).map((item) => ({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio || 0,
      categoriaid: item.categoriaid,
      hotelid: item.hotelid,
      disponible: item.disponible ?? true,
      imagenurl: item.imagenurl,
      alergenos: item.alergenos,
      orden: item.orden || 0,
      activo: item.activo,
    }))

    const precios = itemsMapped.filter((i) => i.precio > 0).map((i) => i.precio)

    const result: oCategoriaConItems = {
      id: cat.id,
      nombre: cat.nombre,
      descripcion: cat.descripcion,
      orden: cat.orden || 0,
      hotelid: cat.hotelid,
      hotelnombre,
      activo: cat.activo,
      fechacreacion: cat.fechacreacion,
      totalitems: itemsMapped.length,
      items: itemsMapped,
      preciomin: precios.length > 0 ? Math.min(...precios) : 0,
      preciomax: precios.length > 0 ? Math.max(...precios) : 0,
    }

    return { success: true, error: "", data: result }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerCategoriaMenu: " + errorMessage, data: null }
  }
}

// Funcion: obtenerItemMenu - Obtiene un item individual
export async function obtenerItemMenu(
  id: number,
): Promise<{ success: boolean; error: string; data: oItemMenu | null }> {
  try {
    const { data: item, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      return { success: false, error: "Error obteniendo item: " + error.message, data: null }
    }

    if (!item) {
      return { success: false, error: "Platillo no encontrado", data: null }
    }

    // Obtener nombres
    let categorianombre: string | undefined
    let hotelnombre: string | undefined

    if (item.categoriaid) {
      const { data: cat } = await supabase
        .from("menu_categories")
        .select("nombre")
        .eq("id", item.categoriaid)
        .maybeSingle()
      categorianombre = cat?.nombre
    }

    if (item.hotelid) {
      const { data: hotel } = await supabase
        .from("hoteles")
        .select("nombre")
        .eq("id", item.hotelid)
        .maybeSingle()
      hotelnombre = hotel?.nombre
    }

    return {
      success: true,
      error: "",
      data: {
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: item.precio || 0,
        categoriaid: item.categoriaid,
        categorianombre,
        hotelid: item.hotelid,
        hotelnombre,
        disponible: item.disponible ?? true,
        imagenurl: item.imagenurl,
        alergenos: item.alergenos,
        orden: item.orden || 0,
        activo: item.activo,
        fechacreacion: item.fechacreacion,
      },
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en obtenerItemMenu: " + errorMessage, data: null }
  }
}

// Funcion: obtenerCategoriasDropdown - Lista de categorias para selects
export async function obtenerCategoriasDropdown(): Promise<{
  success: boolean
  error: string
  data: { value: string; text: string }[] | null
}> {
  try {
    const { data, error } = await supabase
      .from("menu_categories")
      .select("id, nombre")
      .eq("activo", true)
      .order("orden", { ascending: true })

    if (error) {
      return { success: false, error: error.message, data: null }
    }

    return {
      success: true,
      error: "",
      data: (data || []).map((c) => ({ value: c.id.toString(), text: c.nombre })),
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: errorMessage, data: null }
  }
}

/* ==================================================
  INSERTS: CREATE / CREAR / INSERT
================================================== */

// Funcion: crearCategoriaMenu - Crea una nueva categoria de menu
export async function crearCategoriaMenu(datos: {
  nombre: string
  descripcion?: string
  orden?: number
  hotelid?: number | null
}): Promise<{ success: boolean; error: string; data: { id: number } | null }> {
  try {
    if (!datos.nombre || datos.nombre.trim().length < 2) {
      return { success: false, error: "El nombre de la categoria es requerido (minimo 2 caracteres)", data: null }
    }

    // Obtener siguiente orden si no se especifica
    let orden = datos.orden
    if (!orden) {
      const { data: lastCat } = await supabase
        .from("menu_categories")
        .select("orden")
        .order("orden", { ascending: false })
        .limit(1)
        .maybeSingle()
      orden = (lastCat?.orden || 0) + 1
    }

    const insertData = {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      orden,
      hotelid: datos.hotelid || null,
      activo: true,
      fechacreacion: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("menu_categories")
      .insert(insertData)
      .select("id")
      .single()

    if (error) {
      return { success: false, error: "Error al crear categoria: " + error.message, data: null }
    }

    revalidatePath("/menus")
    return { success: true, error: "", data: { id: data.id } }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en crearCategoriaMenu: " + errorMessage, data: null }
  }
}

// Funcion: crearItemMenu - Crea un nuevo item/platillo
export async function crearItemMenu(datos: {
  nombre: string
  descripcion?: string
  precio?: number
  categoriaid: number
  hotelid?: number | null
  disponible?: boolean
  imagenurl?: string | null
  alergenos?: string[] | null
  orden?: number
}): Promise<{ success: boolean; error: string; data: { id: number } | null }> {
  try {
    if (!datos.nombre || datos.nombre.trim().length < 2) {
      return { success: false, error: "El nombre del platillo es requerido (minimo 2 caracteres)", data: null }
    }
    if (!datos.categoriaid) {
      return { success: false, error: "La categoria es requerida", data: null }
    }

    // Obtener siguiente orden si no se especifica
    let orden = datos.orden
    if (!orden) {
      const { data: lastItem } = await supabase
        .from("menu_items")
        .select("orden")
        .eq("categoriaid", datos.categoriaid)
        .order("orden", { ascending: false })
        .limit(1)
        .maybeSingle()
      orden = (lastItem?.orden || 0) + 1
    }

    const insertData = {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      precio: datos.precio || 0,
      categoriaid: datos.categoriaid,
      hotelid: datos.hotelid || null,
      disponible: datos.disponible ?? true,
      imagenurl: datos.imagenurl || null,
      alergenos: datos.alergenos || null,
      orden,
      activo: true,
      fechacreacion: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("menu_items")
      .insert(insertData)
      .select("id")
      .single()

    if (error) {
      return { success: false, error: "Error al crear platillo: " + error.message, data: null }
    }

    revalidatePath("/menus")
    return { success: true, error: "", data: { id: data.id } }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en crearItemMenu: " + errorMessage, data: null }
  }
}

/* ==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */

// Funcion: actualizarCategoriaMenu - Actualiza una categoria existente
export async function actualizarCategoriaMenu(
  id: number,
  datos: {
    nombre?: string
    descripcion?: string
    orden?: number
    hotelid?: number | null
    activo?: boolean
  },
): Promise<{ success: boolean; error: string }> {
  try {
    if (datos.nombre && datos.nombre.trim().length < 2) {
      return { success: false, error: "El nombre debe tener minimo 2 caracteres" }
    }

    // Verificar existencia
    const { data: existing, error: existError } = await supabase
      .from("menu_categories")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (existError || !existing) {
      return { success: false, error: "Categoria no encontrada" }
    }

    const updateData: Record<string, unknown> = {
      fechaactualizacion: new Date().toISOString(),
    }

    if (datos.nombre !== undefined) updateData.nombre = datos.nombre.trim()
    if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion.trim() || null
    if (datos.orden !== undefined) updateData.orden = datos.orden
    if (datos.hotelid !== undefined) updateData.hotelid = datos.hotelid
    if (datos.activo !== undefined) updateData.activo = datos.activo

    const { error } = await supabase
      .from("menu_categories")
      .update(updateData)
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar categoria: " + error.message }
    }

    revalidatePath("/menus")
    revalidatePath(`/menus/categories/${id}`)
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarCategoriaMenu: " + errorMessage }
  }
}

// Funcion: actualizarItemMenu - Actualiza un item existente
export async function actualizarItemMenu(
  id: number,
  datos: {
    nombre?: string
    descripcion?: string
    precio?: number
    categoriaid?: number
    hotelid?: number | null
    disponible?: boolean
    imagenurl?: string | null
    alergenos?: string[] | null
    orden?: number
  },
): Promise<{ success: boolean; error: string }> {
  try {
    if (datos.nombre && datos.nombre.trim().length < 2) {
      return { success: false, error: "El nombre debe tener minimo 2 caracteres" }
    }

    // Verificar existencia
    const { data: existing, error: existError } = await supabase
      .from("menu_items")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (existError || !existing) {
      return { success: false, error: "Platillo no encontrado" }
    }

    const updateData: Record<string, unknown> = {
      fechaactualizacion: new Date().toISOString(),
    }

    if (datos.nombre !== undefined) updateData.nombre = datos.nombre.trim()
    if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion.trim() || null
    if (datos.precio !== undefined) updateData.precio = datos.precio
    if (datos.categoriaid !== undefined) updateData.categoriaid = datos.categoriaid
    if (datos.hotelid !== undefined) updateData.hotelid = datos.hotelid
    if (datos.disponible !== undefined) updateData.disponible = datos.disponible
    if (datos.imagenurl !== undefined) updateData.imagenurl = datos.imagenurl
    if (datos.alergenos !== undefined) updateData.alergenos = datos.alergenos
    if (datos.orden !== undefined) updateData.orden = datos.orden

    const { error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al actualizar platillo: " + error.message }
    }

    revalidatePath("/menus")
    revalidatePath(`/menus/items/${id}`)
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actualizarItemMenu: " + errorMessage }
  }
}

// Funcion: toggleDisponibleItem - Cambia la disponibilidad de un item
export async function toggleDisponibleItem(
  id: number,
  disponible: boolean,
): Promise<{ success: boolean; error: string }> {
  try {
    const { error } = await supabase
      .from("menu_items")
      .update({ disponible, fechaactualizacion: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al cambiar disponibilidad: " + error.message }
    }

    revalidatePath("/menus")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en toggleDisponibleItem: " + errorMessage }
  }
}

/* ==================================================
  DELETES: DROP / ELIMINAR / DELETE
================================================== */

// Funcion: eliminarCategoriaMenu - Elimina (soft delete) una categoria
export async function eliminarCategoriaMenu(
  id: number,
): Promise<{ success: boolean; error: string }> {
  try {
    // Verificar que no tenga items activos
    const { data: items, error: itemError } = await supabase
      .from("menu_items")
      .select("id")
      .eq("categoriaid", id)
      .eq("activo", true)
      .limit(1)

    if (itemError) {
      return { success: false, error: "Error verificando items: " + itemError.message }
    }

    if (items && items.length > 0) {
      return {
        success: false,
        error: "No se puede eliminar la categoria porque tiene platillos activos. Elimina o mueve los platillos primero.",
      }
    }

    const { error } = await supabase
      .from("menu_categories")
      .update({ activo: false, fechaactualizacion: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar categoria: " + error.message }
    }

    revalidatePath("/menus")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en eliminarCategoriaMenu: " + errorMessage }
  }
}

// Funcion: eliminarItemMenu - Elimina (soft delete) un item
export async function eliminarItemMenu(
  id: number,
): Promise<{ success: boolean; error: string }> {
  try {
    const { error } = await supabase
      .from("menu_items")
      .update({ activo: false, fechaactualizacion: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return { success: false, error: "Error al eliminar platillo: " + error.message }
    }

    revalidatePath("/menus")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en eliminarItemMenu: " + errorMessage }
  }
}
