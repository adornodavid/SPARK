"use server"

import { createClient } from "@supabase/supabase-js"
import { read, utils } from "xlsx"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

type ColType = "int" | "num" | "bool" | "ts" | "str"

type TablaConfig = {
  tabla: string
  pk: string
  columnas: Array<{ nombre: string; tipo: ColType }>
}

const TABLAS_MH: Record<string, TablaConfig> = {
  eventos: {
    tabla: "mh_eventos",
    pk: "id_evento",
    columnas: [
      { nombre: "id_evento", tipo: "int" },
      { nombre: "id_tipo_evento", tipo: "int" },
      { nombre: "id_hotel", tipo: "int" },
      { nombre: "id_contacto", tipo: "int" },
      { nombre: "evento", tipo: "str" },
      { nombre: "fecha_inicio", tipo: "ts" },
      { nombre: "fecha_final", tipo: "ts" },
      { nombre: "pax", tipo: "int" },
      { nombre: "min_pax", tipo: "int" },
      { nombre: "valor_total", tipo: "num" },
      { nombre: "valor_renta", tipo: "num" },
      { nombre: "valor_ayb", tipo: "num" },
      { nombre: "valor_hab", tipo: "num" },
      { nombre: "id_estatus", tipo: "int" },
      { nombre: "id_segmento", tipo: "int" },
      { nombre: "id_solicitado_por", tipo: "int" },
      { nombre: "id_autorizado_por", tipo: "int" },
      { nombre: "comentarios", tipo: "str" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
  eventos_salones: {
    tabla: "mh_eventos_salones",
    pk: "id_rec",
    columnas: [
      { nombre: "id_rec", tipo: "int" },
      { nombre: "id_evento", tipo: "int" },
      { nombre: "id_salon", tipo: "int" },
      { nombre: "id_montaje_salon", tipo: "str" },
      { nombre: "fecha_inicio", tipo: "ts" },
      { nombre: "fecha_final", tipo: "ts" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
  estatus: {
    tabla: "mh_estatus",
    pk: "id_estatus",
    columnas: [
      { nombre: "id_estatus", tipo: "int" },
      { nombre: "estatus", tipo: "str" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
  segmentos: {
    tabla: "mh_segmentos",
    pk: "id_segmento",
    columnas: [
      { nombre: "id_segmento", tipo: "int" },
      { nombre: "segmento", tipo: "str" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
  tipo_evento: {
    tabla: "mh_tipo_evento",
    pk: "id_tipo",
    columnas: [
      { nombre: "id_tipo", tipo: "int" },
      { nombre: "tipo_evento", tipo: "str" },
      { nombre: "visible", tipo: "bool" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
  hoteles: {
    tabla: "mh_hoteles",
    pk: "id_hotel",
    columnas: [
      { nombre: "id_hotel", tipo: "int" },
      { nombre: "hotel", tipo: "str" },
      { nombre: "acronimo", tipo: "str" },
      { nombre: "tipo", tipo: "str" },
      { nombre: "id_pais", tipo: "str" },
      { nombre: "id_estado", tipo: "str" },
      { nombre: "id_ciudad", tipo: "str" },
      { nombre: "es_local", tipo: "bool" },
      { nombre: "visible", tipo: "bool" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
  salones: {
    tabla: "mh_salones",
    pk: "id_salon",
    columnas: [
      { nombre: "id_salon", tipo: "int" },
      { nombre: "salon", tipo: "str" },
      { nombre: "valor_renta", tipo: "num" },
      { nombre: "largo", tipo: "num" },
      { nombre: "ancho", tipo: "num" },
      { nombre: "alto", tipo: "num" },
      { nombre: "m2", tipo: "num" },
      { nombre: "id_hotel", tipo: "int" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
  montajes: {
    tabla: "mh_montajes",
    pk: "id_montaje",
    columnas: [
      { nombre: "id_montaje", tipo: "int" },
      { nombre: "montaje", tipo: "str" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
  montaje_salon: {
    tabla: "mh_montaje_salon",
    pk: "id_rec",
    columnas: [
      { nombre: "id_rec", tipo: "int" },
      { nombre: "id_salon", tipo: "int" },
      { nombre: "id_montaje", tipo: "str" },
      { nombre: "capacidad_pax", tipo: "int" },
      { nombre: "pax_min", tipo: "int" },
      { nombre: "pax_max", tipo: "int" },
      { nombre: "tiempo_min", tipo: "int" },
      { nombre: "tiempo_max", tipo: "int" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
  contactos: {
    tabla: "mh_contactos",
    pk: "id_contacto",
    columnas: [
      { nombre: "id_contacto", tipo: "int" },
      { nombre: "nombre", tipo: "str" },
      { nombre: "email_personal", tipo: "str" },
      { nombre: "fecha_cumpleanos", tipo: "ts" },
      { nombre: "telefono", tipo: "str" },
      { nombre: "creado_por", tipo: "int" },
      { nombre: "fecha_alta", tipo: "ts" },
      { nombre: "modificado_por", tipo: "int" },
      { nombre: "fecha_modificacion", tipo: "ts" },
      { nombre: "undone", tipo: "str" },
    ],
  },
}

function toSnakeCase(s: string): string {
  return s
    .trim()
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s\-]+/g, "_")
    .toLowerCase()
}

function normalizeHeader(s: string): string {
  return s.trim().toLowerCase().replace(/[\s_\-]+/g, "")
}

function normalizeValue(val: any, tipo: ColType): any {
  if (val === undefined || val === null) return null
  if (typeof val === "string" && val.trim() === "") return null

  switch (tipo) {
    case "int": {
      const n = Number(val)
      return Number.isFinite(n) ? Math.trunc(n) : null
    }
    case "num": {
      const n = Number(val)
      return Number.isFinite(n) ? n : null
    }
    case "bool": {
      if (typeof val === "boolean") return val
      if (typeof val === "number") return val !== 0
      const s = String(val).trim().toLowerCase()
      if (["true", "1", "si", "sí", "yes", "y"].includes(s)) return true
      if (["false", "0", "no", "n"].includes(s)) return false
      return null
    }
    case "ts": {
      if (val instanceof Date) return val.toISOString()
      const d = new Date(val)
      return isNaN(d.getTime()) ? null : d.toISOString()
    }
    case "str":
    default:
      return String(val)
  }
}

export async function listarMh(
  tablaKey: string,
  limit: number = 50,
  offset: number = 0,
): Promise<{
  success: boolean
  error?: string
  columnas: string[]
  rows: any[]
  total: number
}> {
  const cfg = TABLAS_MH[tablaKey]
  if (!cfg) {
    return { success: false, error: "Tabla no válida", columnas: [], rows: [], total: 0 }
  }

  const { data, error, count } = await supabase
    .from(cfg.tabla)
    .select("*", { count: "exact" })
    .order(cfg.pk, { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return { success: false, error: error.message, columnas: [], rows: [], total: 0 }
  }

  return {
    success: true,
    columnas: cfg.columnas.map((c) => c.nombre),
    rows: data || [],
    total: count || 0,
  }
}

export async function subirExcelMh(fd: FormData): Promise<{
  success: boolean
  error?: string
  procesados: number
  tabla?: string
}> {
  const tablaKey = String(fd.get("tabla") || "")
  const cfg = TABLAS_MH[tablaKey]
  if (!cfg) {
    return { success: false, error: "Tabla no válida", procesados: 0 }
  }

  const file = fd.get("archivo") as File | null
  if (!file || typeof file === "string") {
    return { success: false, error: "No se recibió el archivo", procesados: 0 }
  }

  let jsonRows: Record<string, any>[]
  try {
    const buf = Buffer.from(await file.arrayBuffer())
    const wb = read(buf, { type: "buffer", cellDates: true })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) {
      return { success: false, error: "Excel sin hojas", procesados: 0 }
    }
    const ws = wb.Sheets[sheetName]
    jsonRows = utils.sheet_to_json<Record<string, any>>(ws, {
      raw: true,
      defval: null,
      blankrows: false,
    })
  } catch (e: any) {
    return { success: false, error: `Error parseando Excel: ${e.message}`, procesados: 0 }
  }

  if (jsonRows.length === 0) {
    return { success: false, error: "El Excel no contiene filas", procesados: 0 }
  }

  const headerSample = Object.keys(jsonRows[0])
  const excelToColMap: Record<string, string> = {}
  for (const h of headerSample) {
    const norm = toSnakeCase(h)
    let match = cfg.columnas.find((c) => c.nombre === norm)
    if (!match) {
      const hNoSep = normalizeHeader(h)
      match = cfg.columnas.find((c) => normalizeHeader(c.nombre) === hNoSep)
    }
    if (match) excelToColMap[h] = match.nombre
  }

  if (!Object.values(excelToColMap).includes(cfg.pk)) {
    return {
      success: false,
      error: `El Excel no contiene la columna PK "${cfg.pk}". Headers detectados: [${headerSample
        .map((h) => `"${h}"`)
        .join(", ")}]. Columnas esperadas: [${cfg.columnas.map((c) => c.nombre).join(", ")}]`,
      procesados: 0,
    }
  }

  const tipoPorColumna = Object.fromEntries(cfg.columnas.map((c) => [c.nombre, c.tipo]))
  const rows: any[] = []
  for (const raw of jsonRows) {
    const row: Record<string, any> = {}
    for (const [excelH, col] of Object.entries(excelToColMap)) {
      row[col] = normalizeValue(raw[excelH], tipoPorColumna[col])
    }
    if (row[cfg.pk] === null || row[cfg.pk] === undefined) continue
    rows.push(row)
  }

  if (rows.length === 0) {
    return { success: false, error: "Ninguna fila con PK válida en el Excel", procesados: 0 }
  }

  const CHUNK = 500
  let procesados = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK)
    const { error } = await supabase.from(cfg.tabla).upsert(slice, { onConflict: cfg.pk })
    if (error) {
      return {
        success: false,
        error: `Error en chunk ${i}-${i + slice.length}: ${error.message}`,
        procesados,
        tabla: cfg.tabla,
      }
    }
    procesados += slice.length
  }

  return { success: true, procesados, tabla: cfg.tabla }
}
