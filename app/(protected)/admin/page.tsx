"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Lock, Settings, CloudDownload } from "lucide-react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"

const modules = [
  {
    title: "Usuarios",
    description: "Gestión de usuarios en el sistema",
    icon: Users,
    href: "/admin/usuarios",
  },
  {
    title: "Encriptación",
    description: "Encriptación y hash de texto",
    icon: Lock,
    href: "/admin/encrypt",
  },
  {
    title: "Configuraciones",
    description: "Gestión de configuraciones especiales de la base de datos",
    icon: Settings,
    href: "/configuraciones",
  },
  {
    title: "Extracción Pipedrive",
    description: "Extracción de datos desde Pipedrive CRM",
    icon: CloudDownload,
    href: "/admin/extraccion-pipedrive",
  },
]

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const sessionData = await obtenerSesion()

      if (!sessionData || !sessionData.SesionActiva) {
        router.push("/auth/login")
        return
      }

      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(sessionData.RolId))) {
        router.push("/dashboard")
        return
      }

      setLoading(false)
    }

    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">Módulos de administración del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <Card
            key={mod.href}
            onClick={() => router.push(mod.href)}
            className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
          >
            <CardContent className="flex flex-col items-center text-center gap-4 py-10">
              <div className="rounded-full bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors">
                <mod.icon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {mod.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
