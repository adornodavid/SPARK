"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"

interface MenuCategoriesTableProps {
  categories: any[]
  loading: boolean
  onUpdate: () => void
}

export function MenuCategoriesTable({ categories, loading, onUpdate }: MenuCategoriesTableProps) {
  const supabase = createBrowserClient()

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return

    const { error } = await supabase.from("menu_categories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      alert("Error al eliminar la categoría")
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
            <TableHead>Descripción</TableHead>
            <TableHead className="w-24">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No hay categorías registradas
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/admin/menus/categories/${category.id}`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
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
