"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const statusConfig = {
  draft: { label: "Borrador", variant: "secondary" as const },
  active: { label: "Activo", variant: "default" as const },
  expired: { label: "Expirado", variant: "secondary" as const },
  cancelled: { label: "Cancelado", variant: "destructive" as const },
}

export default function AgreementDetailPage({ params }: { params: { id: string } }) {
  const [agreement, setAgreement] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadAgreement()
  }, [])

  async function loadAgreement() {
    const { data, error } = await supabase
      .from("corporate_agreements")
      .select(`
        *,
        client:clients(name, email, phone, type),
        hotel:hotels(name, address),
        salesperson:users!corporate_agreements_salesperson_id_fkey(first_name, last_name, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error loading agreement:", error)
    } else {
      setAgreement(data)
    }
    setLoading(false)
  }

  async function handleStatusChange(newStatus: string) {
    const { error } = await supabase.from("corporate_agreements").update({ status: newStatus }).eq("id", params.id)

    if (error) {
      console.error("Error updating status:", error)
      alert("Error al actualizar el estado")
    } else {
      loadAgreement()
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  if (!agreement) {
    return <div className="p-6">Convenio no encontrado</div>
  }

  const status = statusConfig[agreement.status as keyof typeof statusConfig]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{agreement.name}</h1>
            <Badge variant={status?.variant}>{status?.label}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Creado el {new Date(agreement.created_at).toLocaleDateString("es-MX")}
          </p>
        </div>
        <Link href={`/admin/agreements/${params.id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={agreement.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreement Information */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{agreement.client?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium capitalize">
                {agreement.client?.type === "individual" ? "Individual" : "Empresa"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{agreement.client?.email || "No proporcionado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{agreement.client?.phone || "No proporcionado"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Hotel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Hotel</p>
              <p className="font-medium">{agreement.hotel?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dirección</p>
              <p className="font-medium">{agreement.hotel?.address || "No proporcionada"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreement Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Convenio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
              <p className="font-medium text-lg">{new Date(agreement.start_date).toLocaleDateString("es-MX")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Fin</p>
              <p className="font-medium text-lg">{new Date(agreement.end_date).toLocaleDateString("es-MX")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descuento</p>
              <p className="font-medium text-lg text-primary">{agreement.discount_percentage}%</p>
            </div>
          </div>

          {agreement.description && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-2">Descripción</p>
              <p className="whitespace-pre-wrap">{agreement.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      {agreement.terms_conditions && (
        <Card>
          <CardHeader>
            <CardTitle>Términos y Condiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{agreement.terms_conditions}</p>
          </CardContent>
        </Card>
      )}

      {/* Internal Notes */}
      {agreement.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas Internas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{agreement.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Salesperson */}
      <Card>
        <CardHeader>
          <CardTitle>Vendedor Asignado</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="font-medium">
              {agreement.salesperson?.first_name} {agreement.salesperson?.last_name}
            </p>
            <p className="text-sm text-muted-foreground">{agreement.salesperson?.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
