import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  const hotelid = Number(request.nextUrl.searchParams.get("hotelid") ?? "-1")

  let query = supabase.from("salones").select("id, nombre").eq("activo", true)

  if (hotelid !== -1) {
    query = query.eq("hotelid", hotelid)
  }

  query = query.order("nombre", { ascending: true }).limit(100)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }

  const items = (data || []).map((s) => ({
    value: s.id.toString(),
    text: s.nombre,
  }))

  return NextResponse.json({ success: true, data: items })
}
