"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, KeyRound, User, Mail, Phone, Shield, Building2, Pencil, CalendarDays } from "lucide-react"
import { obtenerUsuarioDetalle } from "@/app/actions/usuarios"
import { toast } from "sonner"

interface UsuarioDetalle {
  usuarioid: number
  nombrecompleto: string
  usuario: string
  email: string
  telefono: string | null
  imgurl: string | null
  rol: string
  rolid: number
  activo: boolean | string
  ultimoingreso: string | null
  fechacreacion: string | null
  hoteles: { hotelid: number; nombre: string }[]
}

export default function VerUsuarioPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = Number(searchParams.get("id"))

  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || isNaN(id)) {
      router.push("/admin/usuarios")
      return
    }

    async function loadUsuario() {
      const result = await obtenerUsuarioDetalle(id)
      if (result.success && result.data) {
        setUsuario(result.data)
      } else {
        toast.error(result.error || "Error al cargar usuario")
        router.push("/admin/usuarios")
      }
      setLoading(false)
    }

    loadUsuario()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando usuario...</p>
        </div>
      </div>
    )
  }

  if (!usuario) return null

  const esActivo = usuario.activo === true || usuario.activo === "true"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin/usuarios")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{usuario.nombrecompleto}</h1>
          <p className="text-muted-foreground mt-1">Detalle del usuario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bloque: Información de Acceso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-primary" />
              Información de Acceso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Usuario</p>
                <p className="font-medium">{usuario.usuario}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{usuario.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Rol</p>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                  {usuario.rol}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Último ingreso</p>
                <p className="font-medium">
                  {usuario.ultimoingreso
                    ? new Date(usuario.ultimoingreso).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Sin registro"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloque: Información de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-primary" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Nombre completo</p>
                <p className="font-medium">{usuario.nombrecompleto}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="font-medium">{usuario.telefono || "Sin teléfono"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{usuario.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha de creación</p>
                <p className="font-medium">
                  {usuario.fechacreacion
                    ? new Date(usuario.fechacreacion).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Sin registro"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Estatus</p>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    esActivo
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${esActivo ? "bg-emerald-500" : "bg-red-500"}`} />
                  {esActivo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloque: Hoteles Asignados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Hoteles Asignados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usuario.hoteles.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin hoteles asignados</p>
            ) : (
              <div className="space-y-2">
                {usuario.hoteles.map((hotel) => (
                  <div
                    key={hotel.hotelid}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{hotel.nombre}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Botón Editar */}
      <div className="flex justify-end">
        <Button
          onClick={() => router.push(`/admin/usuarios/editar?id=${usuario.usuarioid}`)}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Editar Usuario
        </Button>
      </div>
    </div>
  )
}
