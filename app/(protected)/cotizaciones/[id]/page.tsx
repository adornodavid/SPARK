"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Send, CheckCircle, XCircle, FileText } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const statusConfig = {
  draft: { label: "Borrador", variant: "secondary" as const, color: "text-gray-600" },
  sent: { label: "Enviada", variant: "default" as const, color: "text-blue-600" },
  approved: { label: "Aprobada", variant: "default" as const, color: "text-green-600" },
  rejected: { label: "Rechazada", variant: "destructive" as const, color: "text-red-600" },
  expired: { label: "Expirada", variant: "secondary" as const, color: "text-orange-600" },
}

export default function QuotationDetailPage({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    loadQuotationData()
  }, [])

  async function loadQuotationData() {
    const [quotationRes, itemsRes] = await Promise.all([
      supabase
        .from("banquet_quotations")
        .select(`
          *,
          client:clients(name, email, phone),
          hotel:hotels(name, address, phone),
          event_space:event_spaces(name, capacity),
          salesperson:users!banquet_quotations_salesperson_id_fkey(first_name, last_name, email)
        `)
        .eq("id", params.id)
        .single(),
      supabase.from("banquet_quotation_items").select("*").eq("quotation_id", params.id).order("created_at"),
    ])

    if (quotationRes.error) {
      console.error("Error loading quotation:", quotationRes.error)
    } else {
      setQuotation(quotationRes.data)
    }

    if (itemsRes.data) {
      setItems(itemsRes.data)
    }

    setLoading(false)
  }

  async function handleStatusChange(newStatus: string) {
    const { error } = await supabase.from("banquet_quotations").update({ status: newStatus }).eq("id", params.id)

    if (error) {
      console.error("Error updating status:", error)
      alert("Error al actualizar el estado")
    } else {
      loadQuotationData()
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  if (!quotation) {
    return <div className="p-6">Cotización no encontrada</div>
  }

  const status = statusConfig[quotation.status as keyof typeof statusConfig]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Cotización {quotation.folio}</h1>
            <Badge variant={status?.variant}>{status?.label}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Creada el {new Date(quotation.created_at).toLocaleDateString("es-MX")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/quotations/${params.id}/edit`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generar PDF
          </Button>
        </div>
      </div>

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={quotation.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("sent")}
                disabled={quotation.status === "sent"}
              >
                <Send className="h-4 w-4 mr-2" />
                Marcar como Enviada
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("approved")}
                disabled={quotation.status === "approved"}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("rejected")}
                disabled={quotation.status === "rejected"}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client & Event Information */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{quotation.client?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{quotation.client?.email || "No proporcionado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{quotation.client?.phone || "No proporcionado"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Evento</p>
              <p className="font-medium">{quotation.event_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha del Evento</p>
              <p className="font-medium">{new Date(quotation.event_date).toLocaleDateString("es-MX")}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Hora de Inicio</p>
                <p className="font-medium">{quotation.event_start_time || "No definida"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hora de Fin</p>
                <p className="font-medium">{quotation.event_end_time || "No definida"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Número de Personas</p>
              <p className="font-medium">{quotation.number_of_people}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Venue Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Lugar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Hotel</p>
              <p className="font-medium">{quotation.hotel?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Salón</p>
              <p className="font-medium">{quotation.event_space?.name || "No asignado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Montaje</p>
              <p className="font-medium capitalize">{quotation.setup_type || "No definido"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Items */}
      <Card>
        <CardHeader>
          <CardTitle>Ítems de la Cotización</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay ítems en esta cotización
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="capitalize">{item.type}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.unit_price?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${item.subtotal?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {item.discount_percentage > 0 ? (
                        <span className="text-destructive">
                          -{item.discount_percentage}% (${item.discount_amount?.toLocaleString()})
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">${item.total?.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Separator className="my-6" />

          <div className="space-y-3 max-w-md ml-auto">
            <div className="flex justify-between text-lg">
              <span>Subtotal:</span>
              <span>${quotation.subtotal_amount?.toLocaleString() || "0"}</span>
            </div>
            {quotation.discount_amount > 0 && (
              <div className="flex justify-between text-lg text-destructive">
                <span>Descuento:</span>
                <span>-${quotation.discount_amount?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg">
              <span>IVA (16%):</span>
              <span>${quotation.tax_amount?.toLocaleString() || "0"}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span className="text-primary">${quotation.total_amount?.toLocaleString() || "0"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {(quotation.notes || quotation.internal_notes) && (
        <div className="grid grid-cols-2 gap-6">
          {quotation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas para el Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}
          {quotation.internal_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas Internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{quotation.internal_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Salesperson */}
      <Card>
        <CardHeader>
          <CardTitle>Vendedor Asignado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="font-medium">
                {quotation.salesperson?.first_name} {quotation.salesperson?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{quotation.salesperson?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
