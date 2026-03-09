/**
 * SPARK — Fase 1: Migración de Datos
 * Migra cargasalones → salones + montajesxsalon
 *
 * USO: node scripts/migrate-salones.mjs [--dry-run]
 *
 * --dry-run: Solo muestra lo que haría sin escribir a la BD
 */

// SECURITY: Use environment variables — NEVER hardcode keys
// Run with: SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-salones.mjs
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
  process.exit(1)
}

const DRY_RUN = process.argv.includes("--dry-run")

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
}

// ============================================================
// 1. MAPPING: acronimos viejos (cargasalones) → hoteles.id
// ============================================================
const ACRONYM_MAP = {
  OPLASA: 1,      // MS Milenium Monterrey
  CPMTY: 2,       // Crowne Plaza Monterrey
  DEPAFUSA: 3,    // Holiday Inn Parque Fundidora
  CPTOR: 4,       // Crowne Plaza Torreon
  MILBYESA: 5,    // iStay Hotel Monterrey Historico
  DEPLAJEMO: 6,   // Holiday Inn Express Galerias
  VITASPA: 7,     // Holiday Inn Tijuana Zona Rio
  MILDEVISA: 8,   // iStay Ciudad Victoria
  DEPLAJUSA: 9,   // iStay Ciudad Juarez
  MILDECIS: 11,   // Wyndham Garden McAllen
  MILDEGUSA: 12,  // Holiday Inn Express Guanajuato
  DEPLASILLA: 13, // Holiday Inn Express Mty Tecnologico
  DEPLATOSA: 14,  // Holiday Inn Express Torreon
  MILDESISA: 15,  // Holiday Inn Express Silao Aeropuerto
  // OPERSSIL: null — huerfano, se ignora
}

// ============================================================
// 2. MAPPING: nombre montaje (texto) → montajes.id
// ============================================================
const MONTAJE_MAP = {
  "Auditorio": 1,
  "Escuela": 2,
  "Tipo \"U\"": 3,
  "Tipo U": 3,
  "Ruso": 4,
  "Imperial": 5,
  "Banquete": 6,
  "Coctel": 7,
  "Coctel\t": 7,       // con tab corrupto
  "Cena Baile": 8,
  "Media Luna": 9,
  "Medio Circulos": 10,
  "Medios Circulos": 10,
  "Medios C\ufffdrculos": 10,  // encoding corrupto en MILDECIS
  "Mesa de Juntas": 11,
  "Recepcion": 12,
  "Recepción": 12,
  "Recepci\ufffdn": 12,        // encoding corrupto en MILDECIS
  // "Por Definir" se ignora — no es un montaje real
}

// ============================================================
// Helpers
// ============================================================
async function supabaseGet(table, params = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function supabasePost(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(data) })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`POST ${table} failed: ${res.status} ${errText}`)
  }
  return res.json()
}

async function supabasePatch(table, filter, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`
  const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(data) })
  if (!res.ok) throw new Error(`PATCH ${table} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

function cleanMontajeName(name) {
  return name.trim().replace(/\t/g, "")
}

// ============================================================
// MAIN MIGRATION
// ============================================================
async function main() {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  SPARK — Migración de Datos Fase 1`)
  console.log(`  Modo: ${DRY_RUN ? "🔍 DRY RUN (sin escritura)" : "🔥 EJECUCIÓN REAL"}`)
  console.log(`${"=".repeat(60)}\n`)

  // ---- Fetch all source data ----
  console.log("📥 Cargando datos fuente...")
  const [cargasalones, existingSalones, existingMontajes, montajesCatalog] = await Promise.all([
    supabaseGet("cargasalones", "select=*&order=hotelacronimo,salon,montaje&limit=1000"),
    supabaseGet("salones", "select=id,hotelid,nombre&order=id"),
    supabaseGet("montajesxsalon", "select=id,salonid,montajeid&order=id"),
    supabaseGet("montajes", "select=id,nombre&order=id"),
  ])

  console.log(`  cargasalones: ${cargasalones.length} registros`)
  console.log(`  salones existentes: ${existingSalones.length}`)
  console.log(`  montajesxsalon existentes: ${existingMontajes.length}`)
  console.log(`  montajes catalogo: ${montajesCatalog.length}\n`)

  // ---- Build set of existing salones to skip ----
  const existingSet = new Set(existingSalones.map((s) => `${s.hotelid}:${s.nombre}`))

  // ---- Group cargasalones by hotel+salon (deduplicate) ----
  const salonGroups = new Map() // key: "hotelid:salonName" → { salon info, montajes: [] }
  let skippedOrphan = 0
  let skippedExisting = 0
  let skippedPorDefinir = 0

  for (const row of cargasalones) {
    const hotelId = ACRONYM_MAP[row.hotelacronimo]
    if (!hotelId) {
      skippedOrphan++
      continue
    }

    const salonName = row.salon.trim()
    const key = `${hotelId}:${salonName}`

    // Skip if already exists in salones table
    if (existingSet.has(key)) {
      skippedExisting++
      continue
    }

    if (!salonGroups.has(key)) {
      salonGroups.set(key, {
        hotelid: hotelId,
        nombre: salonName,
        longitud: row.largo || 0,
        ancho: row.ancho || 0,
        altura: row.alto || 0,
        aream2: row.metrosc || 0,
        valor: row.valor || 0,
        capacidades: [],
        montajes: [],
      })
    }

    const group = salonGroups.get(key)
    const montajeName = cleanMontajeName(row.montaje || "")
    const montajeId = MONTAJE_MAP[montajeName]

    if (!montajeId) {
      if (montajeName !== "Por Definir" && montajeName !== "") {
        console.warn(`  ⚠️  Montaje desconocido: "${montajeName}" (salon: ${salonName}, hotel: ${row.hotelacronimo})`)
      } else {
        skippedPorDefinir++
      }
      continue
    }

    // Avoid duplicate montaje entries for same salon
    if (!group.montajes.find((m) => m.montajeid === montajeId)) {
      group.montajes.push({
        montajeid: montajeId,
        capacidadminima: row.paxmin || 0,
        capacidadmaxima: row.paxmax || row.capacidad || 0,
      })
    }

    // Track overall capacity
    if (row.paxmax > 0) group.capacidades.push(row.paxmax)
    if (row.paxmin > 0 && !group.minCap) group.minCap = row.paxmin
  }

  console.log(`📊 Análisis:`)
  console.log(`  Salones únicos a migrar: ${salonGroups.size}`)
  console.log(`  Registros huérfanos (OPERSSIL): ${skippedOrphan}`)
  console.log(`  Registros de salones ya existentes: ${skippedExisting}`)
  console.log(`  Registros "Por Definir" ignorados: ${skippedPorDefinir}\n`)

  // ---- Insert salones ----
  let salonesCreated = 0
  let montajesCreated = 0
  const errors = []

  // Sort by hotelid for organized output
  const sortedGroups = [...salonGroups.entries()].sort((a, b) => {
    const [aKey] = a
    const [bKey] = b
    const aHotel = parseInt(aKey.split(":")[0])
    const bHotel = parseInt(bKey.split(":")[0])
    return aHotel - bHotel || aKey.localeCompare(bKey)
  })

  let currentHotel = null
  for (const [key, group] of sortedGroups) {
    if (group.hotelid !== currentHotel) {
      currentHotel = group.hotelid
      console.log(`\n🏨 Hotel ID ${currentHotel}:`)
    }

    // Calculate capacidad from all montaje rows
    const maxCap = group.capacidades.length > 0 ? Math.max(...group.capacidades) : 0
    const minCap = group.minCap || 1

    const salonData = {
      hotelid: group.hotelid,
      nombre: group.nombre,
      descripcion: "Pendiente",
      longitud: group.longitud,
      ancho: group.ancho,
      altura: group.altura,
      aream2: group.aream2,
      capacidadminima: minCap,
      capacidadmaxima: maxCap,
      precioporhora: group.valor,
      preciopordia: group.valor,
      activo: true,
      estacombinado: false,
    }

    console.log(`  📍 ${group.nombre} (${group.aream2}m², cap: ${minCap}-${maxCap}, $${group.valor}, ${group.montajes.length} montajes)`)

    if (DRY_RUN) {
      salonesCreated++
      montajesCreated += group.montajes.length
      continue
    }

    try {
      // Insert salon
      const [insertedSalon] = await supabasePost("salones", salonData)
      salonesCreated++

      // Insert montajes for this salon
      if (group.montajes.length > 0) {
        const montajeRows = group.montajes.map((m) => ({
          salonid: insertedSalon.id,
          montajeid: m.montajeid,
          capacidadminima: m.capacidadminima,
          capacidadmaxima: m.capacidadmaxima,
          longitud: group.longitud,
          ancho: group.ancho,
          altura: group.altura,
          m2: group.aream2,
          activo: true,
        }))

        await supabasePost("montajesxsalon", montajeRows)
        montajesCreated += montajeRows.length
      }
    } catch (err) {
      errors.push(`${key}: ${err.message}`)
      console.error(`  ❌ Error: ${err.message}`)
    }
  }

  // ---- Fix folio cotizacion id=1 ----
  console.log(`\n📋 Corrigiendo folio cotización id=1...`)
  if (DRY_RUN) {
    console.log(`  Cambiaría folio "1" → "HIPF-E-0"`)
  } else {
    try {
      await supabasePatch("cotizaciones", "id=eq.1", { folio: "HIPF-E-0" })
      console.log(`  ✅ Folio actualizado: "1" → "HIPF-E-0"`)
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`)
    }
  }

  // ---- Summary ----
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  RESUMEN DE MIGRACIÓN`)
  console.log(`${"=".repeat(60)}`)
  console.log(`  Salones creados: ${salonesCreated}`)
  console.log(`  Montajes creados: ${montajesCreated}`)
  console.log(`  Errores: ${errors.length}`)
  if (errors.length > 0) {
    errors.forEach((e) => console.log(`    ❌ ${e}`))
  }
  console.log(`  Modo: ${DRY_RUN ? "DRY RUN" : "EJECUTADO"}\n`)
}

main().catch(console.error)
