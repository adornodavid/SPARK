"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"

interface MenuItemsTableProps {
  items: any[]
  loading: boolean
  onUpdate: () => void
}

export function MenuItemsTable({ items, loading, onUpdate }: MenuItemsTableProps) {
  const supabase = createBrowserClient()

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este platillo?")) return

    const { error } = await supabase.from("menu_items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting item:", error)
      alert("Error al eliminar el platillo")
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
            <TableHead>Categoría</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-24">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No hay platillos registrados
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category?.name}</TableCell>
                <TableCell className="max-w-md truncate">{item.description}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/admin/menus/items/${item.id}`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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
