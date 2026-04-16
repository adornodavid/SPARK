"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Users,
  CheckSquare,
  Activity,
  Building2,
  StickyNote,
  UserCog,
  Target,
  Briefcase,
  FileText,
  GitBranch,
  Layers,
  Package,
  Tag,
  DollarSign,
  Hash,
  Filter,
  Database,
  Shield,
  Lock,
} from "lucide-react"
import { useRouter } from "next/navigation"

const grupos = [
  {
    title: "Contactos y empresas",
    description: "Personas, organizaciones y usuarios del CRM",
    items: [
      { title: "Persons", description: "Contactos y personas registradas en Pipedrive", icon: Users, href: "/admin/extraccion-pipedrive/persons" },
      { title: "Organizations", description: "Organizaciones y empresas en Pipedrive", icon: Building2, href: "/admin/extraccion-pipedrive/organizations" },
      { title: "Users", description: "Usuarios del CRM de Pipedrive", icon: UserCog, href: "/admin/extraccion-pipedrive/users" },
      { title: "Leads", description: "Leads (prospectos) antes de convertirse en tratos", icon: Target, href: "/admin/extraccion-pipedrive/leads" },
    ],
  },
  {
    title: "Actividad comercial",
    description: "Tratos, actividades, tareas, notas y archivos asociados",
    items: [
      { title: "Deals", description: "Tratos (oportunidades comerciales)", icon: Briefcase, href: "/admin/extraccion-pipedrive/deals" },
      { title: "Activities", description: "Actividades registradas en Pipedrive", icon: Activity, href: "/admin/extraccion-pipedrive/activities" },
      // Tasks oculto: feature no disponible en plan actual de Pipedrive ("Required suites missing")
      // { title: "Tasks", description: "Tareas asignadas en Pipedrive", icon: CheckSquare, href: "/admin/extraccion-pipedrive/tasks" },
      { title: "Notes", description: "Notas asociadas a tratos, personas y organizaciones", icon: StickyNote, href: "/admin/extraccion-pipedrive/notes" },
      { title: "Files", description: "Archivos adjuntos al CRM", icon: FileText, href: "/admin/extraccion-pipedrive/files" },
    ],
  },
  {
    title: "Catálogos y configuración",
    description: "Pipelines, etapas, productos, tipos de actividad y catálogos base",
    items: [
      { title: "Pipelines", description: "Embudos de ventas configurados", icon: GitBranch, href: "/admin/extraccion-pipedrive/pipelines" },
      { title: "Stages", description: "Etapas de cada pipeline", icon: Layers, href: "/admin/extraccion-pipedrive/stages" },
      { title: "Products", description: "Productos del catálogo", icon: Package, href: "/admin/extraccion-pipedrive/products" },
      { title: "Activity Types", description: "Tipos de actividades disponibles", icon: Tag, href: "/admin/extraccion-pipedrive/activityTypes" },
      { title: "Currencies", description: "Monedas configuradas en el CRM", icon: DollarSign, href: "/admin/extraccion-pipedrive/currencies" },
      { title: "Lead Labels", description: "Etiquetas aplicables a leads", icon: Hash, href: "/admin/extraccion-pipedrive/leadLabels" },
      { title: "Lead Sources", description: "Fuentes de origen de leads", icon: Hash, href: "/admin/extraccion-pipedrive/leadSources" },
      { title: "Filters", description: "Filtros guardados por usuario", icon: Filter, href: "/admin/extraccion-pipedrive/filters" },
    ],
  },
  {
    title: "Metadata de campos custom",
    description: "Definiciones de campos personalizados por entidad",
    items: [
      { title: "Person Fields", description: "Campos custom de personas", icon: Database, href: "/admin/extraccion-pipedrive/personFields" },
      { title: "Deal Fields", description: "Campos custom de tratos", icon: Database, href: "/admin/extraccion-pipedrive/dealFields" },
      { title: "Organization Fields", description: "Campos custom de organizaciones", icon: Database, href: "/admin/extraccion-pipedrive/organizationFields" },
      { title: "Activity Fields", description: "Campos custom de actividades", icon: Database, href: "/admin/extraccion-pipedrive/activityFields" },
      { title: "Product Fields", description: "Campos custom de productos", icon: Database, href: "/admin/extraccion-pipedrive/productFields" },
      { title: "Note Fields", description: "Campos custom de notas", icon: Database, href: "/admin/extraccion-pipedrive/noteFields" },
    ],
  },
  {
    title: "Permisos y roles",
    description: "Permission sets y roles del CRM",
    items: [
      { title: "Permission Sets", description: "Conjuntos de permisos configurados", icon: Lock, href: "/admin/extraccion-pipedrive/permissionSets" },
      { title: "Roles", description: "Roles jerárquicos de usuarios", icon: Shield, href: "/admin/extraccion-pipedrive/roles" },
    ],
  },
]

export default function ExtraccionPipedrivePage() {
  const router = useRouter()

  return (
    <div className="space-y-8">
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

      {grupos.map((grupo) => (
        <section key={grupo.title} className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{grupo.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{grupo.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {grupo.items.map((ep) => (
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
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {ep.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{ep.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
