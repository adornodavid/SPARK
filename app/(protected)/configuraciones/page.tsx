"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Building2, Settings, Shield } from "lucide-react"
import Link from "next/link"

export default function ConfiguracionesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const session = await obtenerSesion()
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }
      const allowedRoles = [1, 2]
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

  const settingsSections = [
    {
      title: "Configuración General",
      description: "Ajustes básicos del sistema y preferencias de la aplicación",
      icon: Settings,
      href: "#",
    },
    {
      title: "Gestión de Hoteles",
      description: "Configuración de propiedades, políticas y tarifas",
      icon: Building2,
      href: "#",
    },
    {
      title: "Notificaciones",
      description: "Preferencias de notificaciones por email, SMS y sistema",
      icon: Bell,
      href: "#",
    },
    {
      title: "Seguridad y Permisos",
      description: "Gestión de usuarios, roles y permisos de acceso",
      icon: Shield,
      href: "#",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuraciones</h1>
        <p className="text-sm text-muted-foreground">Administra los ajustes y preferencias del sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <section.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Solo los administradores principales tienen acceso a modificar las configuraciones del sistema. Si necesitas
            realizar cambios, contacta al administrador principal.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
