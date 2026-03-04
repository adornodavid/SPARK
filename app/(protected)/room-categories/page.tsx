import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { RoomCategoriesTable } from "@/components/admin/room-categories/room-categories-table"

export default async function RoomCategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("room_categories")
    .select(`
      *,
      hotel:hotels(name, code)
    `)
    .order("hotel_id", { ascending: true })
    .order("name", { ascending: true })

  // Datos de muestra hardcodeados
  const sampleCategories = [
    {
      id: 1,
      name: "Suite Junior",
      description: "Suite con sala de estar y vista panorámica",
      base_price: 2500,
      max_occupancy: 3,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora", code: "HIPF" },
      amenities: ["WiFi", "TV", "Minibar", "Aire acondicionado"],
      created_at: "2024-01-15T10:00:00Z"
    },
    {
      id: 2,
      name: "Habitación Doble Estándar",
      description: "Habitación con dos camas matrimoniales",
      base_price: 1800,
      max_occupancy: 4,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora", code: "HIPF" },
      amenities: ["WiFi", "TV", "Aire acondicionado"],
      created_at: "2024-01-15T10:05:00Z"
    },
    {
      id: 3,
      name: "Suite Ejecutiva",
      description: "Suite amplia con área de trabajo y sala de juntas",
      base_price: 3200,
      max_occupancy: 2,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora", code: "HIPF" },
      amenities: ["WiFi", "TV", "Minibar", "Cafetera", "Escritorio", "Aire acondicionado"],
      created_at: "2024-01-15T10:10:00Z"
    },
    {
      id: 4,
      name: "Habitación Individual",
      description: "Habitación con cama king size",
      base_price: 1500,
      max_occupancy: 2,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora", code: "HIPF" },
      amenities: ["WiFi", "TV", "Aire acondicionado"],
      created_at: "2024-01-15T10:15:00Z"
    },
    {
      id: 5,
      name: "Suite Presidencial",
      description: "Suite de lujo con jacuzzi y terraza privada",
      base_price: 5500,
      max_occupancy: 4,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora", code: "HIPF" },
      amenities: ["WiFi", "TV", "Minibar", "Jacuzzi", "Terraza", "Room service 24h", "Aire acondicionado"],
      created_at: "2024-01-15T10:20:00Z"
    }
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorías de Habitaciones</h1>
          <p className="text-sm text-muted-foreground">Gestiona las categorías y tipos de habitaciones</p>
        </div>
        <Button asChild>
          <Link href="/admin/room-categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Link>
        </Button>
      </div>

      <RoomCategoriesTable categories={sampleCategories || categories || []} />
    </div>
  )
}
