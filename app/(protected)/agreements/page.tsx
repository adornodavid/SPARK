"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"
import { AgreementsTable } from "@/components/admin/agreements/agreements-table"
import { AgreementsFilter } from "@/components/admin/agreements/agreements-filter"

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<any[]>([
    {
      id: 1,
      name: "Convenio Grupo Industrial MTY",
      status: "activo",
      discount_percentage: 15,
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      min_rooms: 10,
      max_rooms: 50,
      client: { name: "María González López", email: "maria.gonzalez@example.com" },
      hotel: { name: "Holiday Inn Parque Fundidora" },
      salesperson: { first_name: "Juan", last_name: "Pérez" },
      created_at: "2023-12-15T10:00:00Z"
    },
    {
      id: 2,
      name: "Convenio Tech Solutions SA",
      status: "activo",
      discount_percentage: 20,
      start_date: "2024-02-01",
      end_date: "2025-01-31",
      min_rooms: 5,
      max_rooms: 30,
      client: { name: "Ana Fernández Sánchez", email: "ana.fernandez@example.com" },
      hotel: { name: "Holiday Inn Parque Fundidora" },
      salesperson: { first_name: "Ana", last_name: "Méndez" },
      created_at: "2024-01-20T14:30:00Z"
    },
    {
      id: 3,
      name: "Convenio Eventos Premium",
      status: "pendiente",
      discount_percentage: 12,
      start_date: "2024-03-01",
      end_date: "2024-08-31",
      min_rooms: 8,
      max_rooms: 40,
      client: { name: "Patricia Torres Mendoza", email: "patricia.torres@example.com" },
      hotel: { name: "Holiday Inn Parque Fundidora" },
      salesperson: { first_name: "Pedro", last_name: "Ramírez" },
      created_at: "2024-02-10T09:15:00Z"
    },
    {
      id: 4,
      name: "Convenio Construcciones del Norte",
      status: "expirado",
      discount_percentage: 10,
      start_date: "2023-06-01",
      end_date: "2023-12-31",
      min_rooms: 15,
      max_rooms: 60,
      client: { name: "Luis Ramírez García", email: "luis.ramirez@example.com" },
      hotel: { name: "Holiday Inn Parque Fundidora" },
      salesperson: { first_name: "María", last_name: "Silva" },
      created_at: "2023-05-15T11:00:00Z"
    }
  ])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    hotel_id: "",
    search: "",
  })
  const supabase = createBrowserClient()

  useEffect(() => {
    loadAgreements()
  }, [filters])

  async function loadAgreements() {
    let query = supabase
      .from("corporate_agreements")
      .select(`
        *,
        client:clients(name, email),
        hotel:hotels(name),
        salesperson:users!corporate_agreements_salesperson_id_fkey(first_name, last_name)
      `)
      .order("created_at", { ascending: false })

    if (filters.status) {
      query = query.eq("status", filters.status)
    }
    if (filters.hotel_id) {
      query = query.eq("hotel_id", filters.hotel_id)
    }
    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error loading agreements:", error)
    } else {
      setAgreements(data || [])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Convenios Corporativos</h1>
          <p className="text-muted-foreground mt-1">Gestiona los convenios con empresas y clientes corporativos</p>
        </div>
        <Link href="/admin/agreements/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Convenio
          </Button>
        </Link>
      </div>

      <AgreementsFilter filters={filters} onFiltersChange={setFilters} />
      <AgreementsTable agreements={agreements} loading={loading} onUpdate={loadAgreements} />
    </div>
  )
}
