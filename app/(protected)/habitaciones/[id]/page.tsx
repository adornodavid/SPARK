"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { RoomForm } from "@/components/admin/rooms/room-form"
import { createBrowserClient } from "@/lib/supabase/client"

export default function EditHabitacionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [room, setRoom] = useState<any>(null)
  const [hotels, setHotels] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()
      const [{ data: roomData }, { data: hotelsData }, { data: categoriesData }] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", resolvedParams.id).single(),
        supabase.from("hotels").select("id,code,name").eq("status", "active").order("name"),
        supabase.from("room_categories").select("id,name").order("name"),
      ])

      if (!roomData) {
        router.push("/habitaciones")
        return
      }

      setRoom(roomData)
      if (hotelsData) setHotels(hotelsData)
      if (categoriesData) setCategories(categoriesData)
      setLoading(false)
    }
    loadData()
  }, [resolvedParams.id, router])

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar Habitación</h1>
        <p className="text-sm text-muted-foreground">Modifica los datos de la habitación</p>
      </div>
      <RoomForm room={room} hotels={hotels} categories={categories} />
    </div>
  )
}
