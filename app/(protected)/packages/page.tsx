"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"
import { PackagesTable } from "@/components/admin/packages/packages-table"

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([
    {
      id: 1,
      name: "Paquete Boda Civil",
      description: "Incluye menú de canapés, montaje para ceremonia civil, cristalería fina, mantelería, vino espumoso para brindis, salón por 2 horas y estacionamiento en cortesía",
      base_price: 950,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora" },
      min_guests: 60,
      includes_venue: true,
      venue_hours: 2,
      includes_food: true,
      includes_beverage: true,
      created_at: "2024-01-10T10:00:00Z"
    },
    {
      id: 2,
      name: "Paquete Boda Romance (Base Ave)",
      description: "Menú especial a tres tiempos, barra libre de refrescos y limonadas, descorche ilimitado, cristalería fina, silla Florencia, centros de mesa en préstamo, salón por 4 horas",
      base_price: 1050,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora" },
      min_guests: 70,
      includes_venue: true,
      venue_hours: 4,
      includes_food: true,
      includes_beverage: true,
      created_at: "2024-01-10T10:05:00Z"
    },
    {
      id: 3,
      name: "Paquete Boda Romance (Base Res)",
      description: "Menú especial a tres tiempos con carne de res, barra libre de refrescos y limonadas, descorche ilimitado, cristalería fina, silla Florencia, centros de mesa en préstamo, salón por 4 horas",
      base_price: 1150,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora" },
      min_guests: 80,
      includes_venue: true,
      venue_hours: 4,
      includes_food: true,
      includes_beverage: true,
      created_at: "2024-01-10T10:10:00Z"
    },
    {
      id: 4,
      name: "Paquete Boda Romance Plus (Base Ave)",
      description: "Menú especial a tres tiempos con degustación, cristalería fina con plato pewter, silla Tiffany, centros de mesa en flor natural, espacio 1 hora para ceremonia, brindis, 1 habitación noche de bodas, salón por 5 horas",
      base_price: 900,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora" },
      min_guests: 50,
      includes_venue: true,
      venue_hours: 5,
      includes_food: true,
      includes_beverage: true,
      created_at: "2024-01-10T10:15:00Z"
    },
    {
      id: 5,
      name: "Paquete Boda Romance Plus (Base Res)",
      description: "Menú especial a tres tiempos de res con degustación, cristalería fina con plato pewter, silla Tiffany, centros de mesa en flor natural, espacio 1 hora para ceremonia, brindis, 1 habitación noche de bodas, salón por 5 horas",
      base_price: 1200,
      hotel_id: 1,
      hotel: { name: "Holiday Inn Parque Fundidora" },
      min_guests: 90,
      includes_venue: true,
      venue_hours: 5,
      includes_food: true,
      includes_beverage: true,
      created_at: "2024-01-10T10:20:00Z"
    }
  ])
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  // Datos hardcodeados - no se necesita cargar de base de datos
  // const loadPackages = async () => {
  //   const { data, error } = await supabase.from("banquet_packages").select("*, hotel:hotels(name)").order("name")
  //   if (error) {
  //     console.error("Error loading packages:", error)
  //   } else {
  //     setPackages(data || [])
  //   }
  //   setLoading(false)
  // }
  // useEffect(() => {
  //   loadPackages()
  // }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paquetes de Banquetes</h1>
          <p className="text-muted-foreground mt-1">Gestiona los paquetes de eventos y banquetes</p>
        </div>
        <Link href="/admin/packages/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Paquete
          </Button>
        </Link>
      </div>

      <PackagesTable packages={packages} loading={loading} onUpdate={() => {}} />
    </div>
  )
}
