"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, CheckSquare, Activity, Building2, StickyNote } from "lucide-react"
import { useRouter } from "next/navigation"

const endpoints = [
  {
    title: "Persons",
    description: "Contactos y personas registradas en Pipedrive",
    icon: Users,
    href: "/admin/extraccion-pipedrive/persons",
  },
  {
    title: "Tasks",
    description: "Tareas asignadas en Pipedrive",
    icon: CheckSquare,
    href: "/admin/extraccion-pipedrive/tasks",
  },
  {
    title: "Activities",
    description: "Actividades registradas en Pipedrive",
    icon: Activity,
    href: "/admin/extraccion-pipedrive/activities",
  },
  {
    title: "Organizations",
    description: "Organizaciones y empresas en Pipedrive",
    icon: Building2,
    href: "/admin/extraccion-pipedrive/organizations",
  },
  {
    title: "Notes",
    description: "Notas asociadas a tratos, personas y organizaciones",
    icon: StickyNote,
    href: "/admin/extraccion-pipedrive/notes",
  },
]

export default function ExtraccionPipedrivePage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Extracción Pipedrive</h1>
          <p className="text-muted-foreground mt-1">Selecciona un endpoint para extraer datos desde Pipedrive CRM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {endpoints.map((ep) => (
          <Card
            key={ep.href}
            onClick={() => router.push(ep.href)}
            className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
          >
            <CardContent className="flex flex-col items-center text-center gap-4 py-10">
              <div className="rounded-full bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors">
                <ep.icon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {ep.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{ep.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
