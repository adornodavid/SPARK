/* ==================================================
  Types para Paquetes

  * Objetos:
    - oPaquete

  * Constantes:
    - TIPOS_PAQUETE
    - TIPO_PAQUETE_CONFIG
================================================== */

export interface oPaquete {
  id: number
  nombre: string
  descripcion: string | null
  hotelid: number
  hotel: string | null
  hotelacrónimo: string | null
  tipo: string
  preciobase: number
  precioporpersona: number
  minimopersonas: number
  maximopersonas: number | null
  incluye: string[]
  vigenciainicio: string | null
  vigenciafin: string | null
  activo: boolean
  fechacreacion: string
  fechaactualizacion: string
}

export const TIPOS_PAQUETE = [
  "Boda",
  "Corporativo",
  "Social",
  "XV Anos",
  "Graduacion",
  "Convencion",
  "Coctel",
  "Otro",
] as const

export type TipoPaquete = (typeof TIPOS_PAQUETE)[number]

export const TIPO_PAQUETE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  "Boda": { label: "Boda", color: "text-pink-700", bgColor: "bg-pink-100 border-pink-300" },
  "Corporativo": { label: "Corporativo", color: "text-blue-700", bgColor: "bg-blue-100 border-blue-300" },
  "Social": { label: "Social", color: "text-purple-700", bgColor: "bg-purple-100 border-purple-300" },
  "XV Anos": { label: "XV Anos", color: "text-rose-700", bgColor: "bg-rose-100 border-rose-300" },
  "Graduacion": { label: "Graduacion", color: "text-amber-700", bgColor: "bg-amber-100 border-amber-300" },
  "Convencion": { label: "Convencion", color: "text-teal-700", bgColor: "bg-teal-100 border-teal-300" },
  "Coctel": { label: "Coctel", color: "text-orange-700", bgColor: "bg-orange-100 border-orange-300" },
  "Otro": { label: "Otro", color: "text-foreground", bgColor: "bg-muted border-border" },
}
