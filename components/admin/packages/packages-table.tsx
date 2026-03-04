"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

interface PackagesTableProps {
  packages: any[]
  loading: boolean
  onUpdate: () => void
}

export function PackagesTable({ packages, loading, onUpdate }: PackagesTableProps) {
  const supabase = createBrowserClient()

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este paquete?")) return

    const { error } = await supabase.from("banquet_packages").delete().eq("id", id)

    if (error) {
      console.error("Error deleting package:", error)
      alert("Error al eliminar el paquete")
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
            <TableHead>Hotel</TableHead>
            <TableHead>Precio por Persona</TableHead>
            <TableHead>Mín. Personas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-24">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No hay paquetes registrados
              </TableCell>
            </TableRow>
          ) : (
            packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>{pkg.hotel?.name}</TableCell>
                <TableCell>${pkg.base_price?.toLocaleString()}</TableCell>
                <TableCell>{pkg.min_guests}</TableCell>
                <TableCell>
                  <Badge variant={pkg.is_active ? "default" : "secondary"}>
                    {pkg.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/admin/packages/${pkg.id}`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
