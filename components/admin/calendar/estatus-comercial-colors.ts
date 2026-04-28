// Helper central para colores de eventos según la columna `estatuscomercial` de vw_oeventos.
// Valores en DB: "Tentativo" | "Definitivo" | "Cancelado" (más fallback para otros).

export type EstatusComercial = "Tentativo" | "Definitivo" | "Cancelado"

export const ESTATUS_COMERCIAL_ORDER: EstatusComercial[] = ["Tentativo", "Definitivo", "Cancelado"]

// Colores RGB crudos (para gradients CSS)
export const ESTATUS_COMERCIAL_RGB: Record<EstatusComercial, string> = {
  Tentativo: "rgb(234 179 8)",       // yellow-500
  Definitivo: "rgb(4 120 87)",        // emerald-700
  Cancelado: "rgb(185 28 28)",        // red-700
}

export interface EstatusComercialStyle {
  label: string
  key: EstatusComercial | "Desconocido"
  fill: string           // bg+text para badge sólido (ej. día con un solo estatus)
  soft: string           // bg+border+text pastel (ej. card detalle)
  border: string         // border+text (ej. outline pill)
  borderLeft: string     // border-l-4 para cards de lista
  dot: string            // bg para dot de leyenda
  rgb: string            // rgb(...) para gradients
}

const STYLES: Record<EstatusComercial, EstatusComercialStyle> = {
  Tentativo: {
    label: "Tentativo",
    key: "Tentativo",
    fill: "bg-yellow-500 text-yellow-950",
    soft: "bg-yellow-100 border-yellow-400 text-yellow-900",
    border: "border-yellow-500 text-yellow-800",
    borderLeft: "border-l-4 border-l-yellow-500 hover:border-yellow-600",
    dot: "bg-yellow-500",
    rgb: ESTATUS_COMERCIAL_RGB.Tentativo,
  },
  Definitivo: {
    label: "Definitivo",
    key: "Definitivo",
    fill: "bg-emerald-700 text-white",
    soft: "bg-emerald-100 border-emerald-400 text-emerald-900",
    border: "border-emerald-700 text-emerald-800",
    borderLeft: "border-l-4 border-l-emerald-700 hover:border-emerald-800",
    dot: "bg-emerald-700",
    rgb: ESTATUS_COMERCIAL_RGB.Definitivo,
  },
  Cancelado: {
    label: "Cancelado",
    key: "Cancelado",
    fill: "bg-red-700 text-white",
    soft: "bg-red-100 border-red-400 text-red-900",
    border: "border-red-700 text-red-800",
    borderLeft: "border-l-4 border-l-red-700 hover:border-red-800",
    dot: "bg-red-700",
    rgb: ESTATUS_COMERCIAL_RGB.Cancelado,
  },
}

const FALLBACK: EstatusComercialStyle = {
  label: "Sin estatus",
  key: "Desconocido",
  fill: "bg-slate-500 text-white",
  soft: "bg-slate-50 border-slate-300 text-slate-700",
  border: "border-slate-400 text-slate-600",
  borderLeft: "border-l-4 border-l-slate-500 hover:border-slate-600",
  dot: "bg-slate-500",
  rgb: "rgb(100 116 139)", // slate-500
}

export function normalizarEstatusComercial(ec: unknown): EstatusComercial | null {
  const s = String(ec ?? "").trim().toLowerCase()
  if (s === "tentativo") return "Tentativo"
  if (s === "definitivo") return "Definitivo"
  if (s === "cancelado") return "Cancelado"
  return null
}

export function getEstatusComercialStyle(ec: unknown): EstatusComercialStyle {
  const key = normalizarEstatusComercial(ec)
  return key ? STYLES[key] : FALLBACK
}

// Agrupa eventos por estatuscomercial y devuelve los estatus presentes en orden Tentativo→Definitivo→Cancelado.
export function estatusComercialPresentes(eventos: Array<{ estatuscomercial?: unknown } | any>): EstatusComercial[] {
  const set = new Set<EstatusComercial>()
  for (const e of eventos) {
    const k = normalizarEstatusComercial((e as any)?.estatuscomercial)
    if (k) set.add(k)
  }
  return ESTATUS_COMERCIAL_ORDER.filter((k) => set.has(k))
}
