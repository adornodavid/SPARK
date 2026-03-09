/* ==================================================
  * Objetos:
    - oHabitacion
    - oHabitacionDetalle
    - oCategoriaHabitacion
    - oCategoriaHabitacionDetalle

  * Enums / Constants:
    - EstadoHabitacion
    - ESTADOS_HABITACION

  * Especiales:
    - Json
================================================== */

// Types especiales
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Estados de habitacion
export type EstadoHabitacion = "disponible" | "ocupada" | "mantenimiento" | "fuera_de_servicio"

export const ESTADOS_HABITACION: { value: EstadoHabitacion; label: string; color: string }[] = [
  { value: "disponible", label: "Disponible", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "ocupada", label: "Ocupada", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  { value: "mantenimiento", label: "Mantenimiento", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "fuera_de_servicio", label: "Fuera de Servicio", color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400" },
]

// oHabitacion — registro basico de la tabla rooms
export interface oHabitacion {
  id: string
  hotel_id: string
  category_id: string | null
  room_number: string
  floor: number | null
  status: EstadoHabitacion
  capacity: number | null
  rack_price: number | null
  description: string | null
  amenities: Json | null
  notes: string | null
  is_available: boolean
  created_at: string | null
  updated_at: string | null
}

// oHabitacionDetalle — habitacion con datos de hotel y categoria (join)
export interface oHabitacionDetalle extends oHabitacion {
  hotel: {
    name: string
    code: string
  } | null
  room_categories: {
    id: string
    name: string
    base_price: number | null
    max_occupancy: number | null
  } | null
}

// oCategoriaHabitacion — registro basico de la tabla room_categories
export interface oCategoriaHabitacion {
  id: string
  hotel_id: string
  name: string
  description: string | null
  base_price: number | null
  max_occupancy: number | null
  amenities: Json | null
  created_at: string | null
  updated_at: string | null
}

// oCategoriaHabitacionDetalle — categoria con datos de hotel (join)
export interface oCategoriaHabitacionDetalle extends oCategoriaHabitacion {
  hotel: {
    name: string
    code: string
  } | null
  _count?: {
    rooms: number
  }
}

// Form data types
export interface HabitacionFormData {
  hotel_id: string
  category_id: string
  room_number: string
  floor: number | null
  status: EstadoHabitacion
  capacity: number | null
  rack_price: number | null
  description: string
  amenities: string[]
  notes: string
}

export interface CategoriaFormData {
  hotel_id: string
  name: string
  description: string
  base_price: number | null
  max_occupancy: number | null
  amenities: string[]
}

// ddlItem para dropdowns
export interface ddlHotel {
  id: string
  code: string
  name: string
}

export interface ddlCategoria {
  id: string
  name: string
  hotel_id: string
}
