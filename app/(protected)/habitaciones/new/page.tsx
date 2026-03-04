"use client"

import { useEffect, useState } from "react"
import { RoomForm } from "@/components/admin/rooms/room-form"
import { createBrowserClient } from "@/lib/supabase/client"

export default function NewHabitacionPage() {
  const [hotels, setHotels] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()
      const [{ data: hotelsData }, { data: categoriesData }] = await Promise.all([
        supabase.from("hotels").select("id,code,name").eq("status", "active").order("name"),
        supabase.from("room_categories").select("id,name").order("name"),
      ])
      if (hotelsData) setHotels(hotelsData)
      if (categoriesData) setCategories(categoriesData)
    }
    loadData()
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva Habitación</h1>
        <p className="text-sm text-muted-foreground">Registra una nueva habitación en el sistema</p>
      </div>
      <RoomForm hotels={hotels} categories={categories} />
    </div>
  )
}
