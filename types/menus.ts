/* ==================================================
  Tipos para el modulo de Menus
  - oCategoriaMenu: Categoria individual
  - oItemMenu: Item/platillo individual
  - oCategoriaConItems: Categoria con items anidados
  - oMenuFiltros: Filtros para busqueda
================================================== */

export interface oCategoriaMenu {
  id: number
  nombre: string
  descripcion: string | null
  orden: number
  hotelid: number | null
  hotelnombre?: string
  activo: boolean
  fechacreacion?: string
  fechaactualizacion?: string
  totalitems?: number
}

export interface oItemMenu {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  categoriaid: number
  categorianombre?: string
  hotelid: number | null
  hotelnombre?: string
  disponible: boolean
  imagenurl: string | null
  alergenos: string[] | null
  orden: number
  activo: boolean
  fechacreacion?: string
  fechaactualizacion?: string
}

export interface oCategoriaConItems extends oCategoriaMenu {
  items: oItemMenu[]
  preciomin: number
  preciomax: number
}

export interface oMenuFiltros {
  busqueda?: string
  hotelid?: number
  categoriaid?: number
  disponible?: boolean
}

export const ALERGENOS_COMUNES = [
  "Gluten",
  "Lacteos",
  "Huevo",
  "Pescado",
  "Mariscos",
  "Frutos secos",
  "Cacahuates",
  "Soya",
  "Apio",
  "Mostaza",
  "Sesamo",
  "Sulfitos",
] as const

export type Alergeno = (typeof ALERGENOS_COMUNES)[number]
