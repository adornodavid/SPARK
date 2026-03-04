"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

interface QuotationsTableProps {
  quotations: any[]
  loading: boolean
  onUpdate: () => void
}

const statusConfig = {
  draft: { label: "Borrador", variant: "secondary" as const },
  sent: { label: "Enviada", variant: "default" as const },
  approved: { label: "Aprobada", variant: "default" as const },
  rejected: { label: "Rechazada", variant: "destructive" as const },
  expired: { label: "Expirada", variant: "secondary" as const },
}

export function QuotationsTable({ quotations, loading, onUpdate }: QuotationsTableProps) {
  const supabase = createBrowserClient()

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta cotización?")) return

    const { error } = await supabase.from("banquet_quotations").delete().eq("id", id)

    if (error) {
      console.error("Error deleting quotation:", error)
      alert("Error al eliminar la cotización")
    } else {
      onUpdate()
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Hotel</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Fecha Evento</TableHead>
            <TableHead>Personas</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-32">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No hay cotizaciones registradas
              </TableCell>
            </TableRow>
          ) : (
            quotations.map((quotation) => {
              const status = statusConfig[quotation.status as keyof typeof statusConfig]
              return (
                <TableRow key={quotation.id}>
                  <TableCell className="font-medium">{quotation.folio}</TableCell>
                  <TableCell>{quotation.cliente || quotation.client?.name}</TableCell>
                  <TableCell>{quotation.hotel || quotation.hotel?.name}</TableCell>
                  <TableCell>{quotation.nombreevento || quotation.event_type}</TableCell>
                  <TableCell>
                    {quotation.fechainicio ? new Date(quotation.fechainicio).toLocaleDateString("es-MX") : "-"}
                  </TableCell>
                  <TableCell>{quotation.numeroinvitados || quotation.number_of_people}</TableCell>
                  <TableCell>${(quotation.totalmonto || quotation.total_amount)?.toLocaleString() || "0"}</TableCell>
                  <TableCell>
                    <Badge variant={status?.variant || "secondary"}>{status?.label || quotation.estatus || quotation.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/cotizaciones/${quotation.id}`}>
                        <Button variant="ghost" size="icon" title="Ver detalles">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/cotizaciones/new?editId=${quotation.id}`}>
                        <Button variant="ghost" size="icon" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(quotation.id)} title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
