"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Pencil, Trash2, UtensilsCrossed } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { toast } from "sonner"
import { eliminarItemMenu, toggleDisponibleItem } from "@/app/actions/menus"
import type { oItemMenu } from "@/types/menus"

const formatPrecio = (precio: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(precio)

interface MenuItemsTableProps {
  items: oItemMenu[]
  loading: boolean
  onUpdate: () => void
}

export function MenuItemsTable({ items, loading, onUpdate }: MenuItemsTableProps) {
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())

  async function handleToggleDisponible(id: number, disponible: boolean) {
    setTogglingIds((prev) => new Set(prev).add(id))
    const result = await toggleDisponibleItem(id, disponible)
    setTogglingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    if (result.success) {
      toast.success(disponible ? "Platillo marcado como disponible" : "Platillo marcado como no disponible")
      onUpdate()
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete(id: number, nombre: string) {
    const result = await eliminarItemMenu(id)
    if (result.success) {
      toast.success(`Platillo "${nombre}" eliminado correctamente`)
      onUpdate()
    } else {
      toast.error(result.error)
    }
  }

  if (loading) {
    return (
      <div className="spark-card overflow-hidden">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-12 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="spark-card p-12 text-center">
        <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">No hay platillos registrados</h3>
        <p className="text-sm text-muted-foreground">
          Los platillos aparecen aqui cuando se agregan a una categoria
        </p>
      </div>
    )
  }

  return (
    <div className="spark-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Platillo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-center">Disponible</TableHead>
            <TableHead>Alergenos</TableHead>
            <TableHead className="w-24 text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className={!item.disponible ? "opacity-60" : ""}>
              <TableCell>
                <div>
                  <span className="font-medium text-foreground">{item.nombre}</span>
                  {item.descripcion && (
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
                      {item.descripcion}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {item.categorianombre || `Cat. ${item.categoriaid}`}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.precio > 0 ? formatPrecio(item.precio) : <span className="text-muted-foreground">S/P</span>}
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={item.disponible}
                  onCheckedChange={(checked) => handleToggleDisponible(item.id, checked)}
                  disabled={togglingIds.has(item.id)}
                />
              </TableCell>
              <TableCell>
                {item.alergenos && item.alergenos.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.alergenos.map((a) => (
                      <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-1">
                  <Link href={`/menus/items/${item.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar platillo</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Estas seguro de eliminar el platillo &quot;{item.nombre}&quot;? Esta accion no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id, item.nombre)}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
