"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

interface AgreementsTableProps {
  agreements: any[]
  loading: boolean
  onUpdate: () => void
}

const statusConfig = {
  draft: { label: "Borrador", variant: "secondary" as const },
  active: { label: "Activo", variant: "default" as const },
  expired: { label: "Expirado", variant: "secondary" as const },
  cancelled: { label: "Cancelado", variant: "destructive" as const },
}

export function AgreementsTable({ agreements, loading, onUpdate }: AgreementsTableProps) {
  const supabase = createBrowserClient()

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este convenio?")) return

    const { error } = await supabase.from("corporate_agreements").delete().eq("id", id)

    if (error) {
      console.error("Error deleting agreement:", error)
      alert("Error al eliminar el convenio")
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
            <TableHead>Nombre</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Hotel</TableHead>
            <TableHead>Descuento</TableHead>
            <TableHead>Vigencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-32">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agreements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No hay convenios registrados
              </TableCell>
            </TableRow>
          ) : (
            agreements.map((agreement) => {
              const status = statusConfig[agreement.status as keyof typeof statusConfig]
              return (
                <TableRow key={agreement.id}>
                  <TableCell className="font-medium">{agreement.name}</TableCell>
                  <TableCell>{agreement.client?.name}</TableCell>
                  <TableCell>{agreement.hotel?.name}</TableCell>
                  <TableCell>{agreement.discount_percentage}%</TableCell>
                  <TableCell>
                    {new Date(agreement.start_date).toLocaleDateString("es-MX")} -{" "}
                    {new Date(agreement.end_date).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status?.variant || "secondary"}>{status?.label || agreement.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/admin/agreements/${agreement.id}`}>
                        <Button variant="ghost" size="icon" title="Ver">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/agreements/${agreement.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(agreement.id)} title="Eliminar">
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
