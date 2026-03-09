/* ==================================================
  Convenios (Agreements) Types

  * Objetos:
    - oConvenio
    - oConvenioForm

  * Constantes:
    - ESTADOS_CONVENIO
    - TIPOS_DESCUENTO
    - APLICA_A_OPTIONS
================================================== */

// Estado del convenio
export const ESTADOS_CONVENIO = {
  ACTIVO: "activo",
  VENCIDO: "vencido",
  CANCELADO: "cancelado",
} as const

export const ESTADO_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  activo: { label: "Activo", color: "text-emerald-700", bgColor: "bg-emerald-100 border-emerald-300" },
  vencido: { label: "Vencido", color: "text-red-700", bgColor: "bg-red-100 border-red-300" },
  cancelado: { label: "Cancelado", color: "text-muted-foreground", bgColor: "bg-muted border-border" },
}

export const TIPOS_DESCUENTO = [
  { value: "porcentaje", label: "Porcentaje (%)" },
  { value: "monto_fijo", label: "Monto Fijo ($)" },
] as const

export const APLICA_A_OPTIONS = [
  { value: "habitaciones", label: "Habitaciones" },
  { value: "salones", label: "Salones" },
  { value: "ambos", label: "Ambos" },
] as const

// Objeto de convenio como viene de la vista vw_oconvenios
export interface oConvenio {
  id: number
  empresa: string
  contacto: string | null
  email: string | null
  telefono: string | null
  hotelid: number | null
  hotel: string | null
  tipo_descuento: "porcentaje" | "monto_fijo"
  descuento_valor: number
  aplica_a: "habitaciones" | "salones" | "ambos"
  condiciones: string | null
  vigencia_inicio: string
  vigencia_fin: string
  estado: "activo" | "vencido" | "cancelado"
  notas: string | null
  version: number
  convenio_padre_id: number | null
  activo: boolean
  fechacreacion: string
  fechaactualizacion: string | null
}

// Datos del formulario para crear/editar convenio
export interface oConvenioForm {
  empresa: string
  contacto: string
  email: string
  telefono: string
  hotelid: number | null
  tipo_descuento: "porcentaje" | "monto_fijo"
  descuento_valor: number
  aplica_a: "habitaciones" | "salones" | "ambos"
  condiciones: string
  vigencia_inicio: string
  vigencia_fin: string
  estado: "activo" | "vencido" | "cancelado"
  notas: string
}
