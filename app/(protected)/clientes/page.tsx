"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ClientsTable } from "@/components/admin/clients/clients-table"
import { ClientsFilter } from "@/components/admin/clients/clients-filter"

export default function ClientsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([
    {
      id: 1,
      company_name: "Grupo Industrial MTY",
      first_name: "María",
      last_name: "González López",
      type: "empresa",
      email: "maria.gonzalez@example.com",
      phone: "8112345678",
      ciudad: "Monterrey",
      city: "Monterrey",
      assigned_to_user: null,
      created_at: "2024-01-15T10:30:00Z"
    },
    {
      id: 2,
      company_name: null,
      first_name: "Carlos",
      last_name: "Rodríguez Martínez",
      type: "individual",
      email: "carlos.rodriguez@example.com",
      phone: "8187654321",
      ciudad: "Monterrey",
      city: "Monterrey",
      assigned_to_user: null,
      created_at: "2024-01-20T14:15:00Z"
    },
    {
      id: 3,
      company_name: "Tech Solutions SA",
      first_name: "Ana",
      last_name: "Fernández Sánchez",
      type: "empresa",
      email: "ana.fernandez@example.com",
      phone: "8198765432",
      ciudad: "Monterrey",
      city: "Monterrey",
      assigned_to_user: null,
      created_at: "2024-02-05T09:00:00Z"
    },
    {
      id: 4,
      company_name: null,
      first_name: "Luis",
      last_name: "Ramírez García",
      type: "individual",
      email: "luis.ramirez@example.com",
      phone: "8156789012",
      ciudad: "Monterrey",
      city: "Monterrey",
      assigned_to_user: null,
      created_at: "2024-02-10T16:45:00Z"
    },
    {
      id: 5,
      company_name: "Eventos Premium",
      first_name: "Patricia",
      last_name: "Torres Mendoza",
      type: "empresa",
      email: "patricia.torres@example.com",
      phone: "8134567890",
      ciudad: "Monterrey",
      city: "Monterrey",
      assigned_to_user: null,
      created_at: "2024-02-18T11:20:00Z"
    }
  ])

  useEffect(() => {
    async function checkSessionAndLoadData() {
      const session = await obtenerSesion()

      // Validar sesión activa
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }

      // Validar roles permitidos (1,2,3,4)
      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(session.RolId))) {
        router.push("/dashboard")
        return
      }

      setLoading(false)
    }

    checkSessionAndLoadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu cartera de clientes</p>
        </div>
        <Button asChild>
          <Link href="/clientes/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <ClientsFilter />

      <ClientsTable clients={clients || []} />
    </div>
  )
}
