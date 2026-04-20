import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

const env = readFileSync("./.env.local", "utf8")
  .split("\n")
  .filter((l) => l.includes("="))
  .reduce((acc, l) => {
    const [k, ...rest] = l.split("=")
    acc[k.trim()] = rest.join("=").trim()
    return acc
  }, {})

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

console.log("URL:", url)
console.log("Key (first 20):", key?.slice(0, 20), "...")

const supabase = createClient(url, key)

try {
  const { data, error, count } = await supabase
    .from("usuarios")
    .select("id, email, usuario, activo", { count: "exact" })
    .limit(3)

  if (error) {
    console.error("ERROR:", JSON.stringify(error, null, 2))
  } else {
    console.log("OK — total usuarios:", count)
    console.log("Sample:", data)
  }
} catch (e) {
  console.error("EXCEPTION:", e.message)
  console.error(e.cause || e)
}
