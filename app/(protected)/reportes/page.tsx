"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export default function ReportesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const session = await obtenerSesion()
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }
      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(session.RolId))) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const reportTypes = [
    {
      title: "Reporte de Reservaciones",
      description: "Análisis detallado de reservaciones por período, hotel y estado",
      icon: FileText,
      href: "#",
    },
    {
      title: "Ocupación de Habitaciones",
      description: "Porcentaje de ocupación y disponibilidad por hotel",
      icon: BarChart3,
      href: "#",
    },
    {
      title: "Clientes y Ventas",
      description: "Estadísticas de clientes, convenios y rendimiento comercial",
      icon: Users,
      href: "#",
    },
    {
      title: "Tendencias y Proyecciones",
      description: "Análisis de tendencias y proyecciones de ocupación",
      icon: TrendingUp,
      href: "#",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reportes y Estadísticas</h1>
        <p className="text-sm text-muted-foreground">
          Visualiza el rendimiento del sistema y genera reportes personalizados
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reportTypes.map((report) => (
          <Link key={report.title} href={report.href}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>Estamos trabajando en nuevos reportes y funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Los reportes detallados estarán disponibles próximamente. Por ahora puedes consultar los datos desde las
            secciones de reservaciones, habitaciones y clientes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
