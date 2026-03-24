import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Wrench, Shield, Settings } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Administración</h1>
        <p className="text-muted-foreground text-lg">Sección para la administración del sistema SPARK</p>
        <p className="text-sm text-muted-foreground max-w-3xl">
          En esta sección encontrarás herramientas web para gestionar usuarios, ayudar con temas de encriptación y
          cargas de contenido, así como la definición de determinadas configuraciones que se utilizan en los procesos
          internos del sistema.
        </p>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Gestión de Usuarios */}
        <Link href="/admin/usuarios">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle>Gestión de Usuarios</CardTitle>
              </div>
              <CardDescription>Administra los usuarios del sistema, sus perfiles y accesos</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Herramientas Web */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              <CardTitle>Herramientas Web</CardTitle>
            </div>
            <CardDescription>Utilidades y herramientas para tareas administrativas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/encrypt" className="block p-3 rounded-md hover:bg-accent transition-colors">
              <div className="font-medium">Encriptación</div>
              <div className="text-sm text-muted-foreground">Herramientas de encriptación y desencriptación</div>
            </Link>
            <Link href="/admin/cargas" className="block p-3 rounded-md hover:bg-accent transition-colors">
              <div className="font-medium">Cargas</div>
              <div className="text-sm text-muted-foreground">Carga masiva de datos y contenido</div>
            </Link>
          </CardContent>
        </Card>

        {/* Gestión de Roles y Permisos */}
        <Link href="/admin/roles-permisos">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle>Gestión de Roles y Permisos</CardTitle>
              </div>
              <CardDescription>Configura roles de usuario y sus permisos en el sistema</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Configuraciones */}
        <Link href="/admin/configuraciones">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle>Configuraciones</CardTitle>
              </div>
              <CardDescription>Define configuraciones del sistema y procesos internos</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
