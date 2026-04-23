import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cargar .env.local manualmente (sin dependencias)
const envPath = path.join(__dirname, "..", ".env.local");
const envText = fs.readFileSync(envPath, "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function toCsvCell(val) {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "object") val = JSON.stringify(val);
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function exportTable(table, outPath) {
  console.log(`\n=== ${table} ===`);
  const pageSize = 1000;
  let offset = 0;
  let columns = null;
  let total = 0;
  const stream = fs.createWriteStream(outPath, { encoding: "utf8" });
  // BOM para que Excel detecte UTF-8
  stream.write("﻿");

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;

    if (!columns) {
      columns = Object.keys(data[0]);
      stream.write(columns.map(toCsvCell).join(",") + "\n");
    }
    for (const row of data) {
      stream.write(columns.map((c) => toCsvCell(row[c])).join(",") + "\n");
    }
    total += data.length;
    console.log(`  +${data.length} (total: ${total})`);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  await new Promise((res) => stream.end(res));
  console.log(`OK → ${outPath} (${total} filas, ${columns?.length ?? 0} columnas)`);
  return total;
}

const outDir = process.argv[2] || path.join(__dirname, "..", "..", "..", "..", "Users", "omar.coronel");
fs.mkdirSync(outDir, { recursive: true });

try {
  await exportTable("eventos", path.join(outDir, "eventos.csv"));
  await exportTable("eventoxreservaciones", path.join(outDir, "eventoxreservaciones.csv"));
  console.log("\nListo.");
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
