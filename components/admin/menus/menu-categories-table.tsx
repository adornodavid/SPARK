"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  UtensilsCrossed,
  Building2,
} from "lucide-react"
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
import Link from "next/link"
import { toast } from "sonner"
import { eliminarCategoriaMenu } from "@/app/actions/menus"
import type { oCategoriaConItems } from "@/types/menus"
import { Skeleton } from "@/components/ui/skeleton"

const formatPrecio = (precio: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(precio)

interface MenuCategoriesListProps {
  categorias: oCategoriaConItems[]
  loading: boolean
  onUpdate: () => void
}

export function MenuCategoriesTable({ categorias, loading, onUpdate }: MenuCategoriesListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleDelete(id: number, nombre: string) {
    const result = await eliminarCategoriaMenu(id)
    if (result.success) {
      toast.success(`Categoria "${nombre}" eliminada correctamente`)
      onUpdate()
    } else {
      toast.error(result.error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="spark-card p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-20 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (categorias.length === 0) {
    return (
      <div className="spark-card p-12 text-center">
        <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">No hay categorias registradas</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crea tu primera categoria para organizar los platillos del menu
        </p>
        <Link href="/menus/categories/new">
          <Button className="bg-foreground text-background hover:bg-foreground/90">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoria
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {categorias.map((cat) => {
        const isExpanded = expandedIds.has(cat.id)

        return (
          <div key={cat.id} className="spark-card overflow-hidden">
            {/* Header de la categoria */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpanded(cat.id)}
            >
              <button className="shrink-0 text-muted-foreground">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{cat.nombre}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {cat.totalitems} {cat.totalitems === 1 ? "platillo" : "platillos"}
                  </Badge>
                  {cat.hotelnombre && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Building2 className="h-3 w-3" />
                      {cat.hotelnombre}
                    </Badge>
                  )}
                </div>
                {cat.descripcion && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{cat.descripcion}</p>
                )}
              </div>

              {/* Rango de precios */}
              {cat.preciomax > 0 && (
                <div className="text-sm text-muted-foreground shrink-0">
                  {cat.preciomin === cat.preciomax
                    ? formatPrecio(cat.preciomin)
                    : `${formatPrecio(cat.preciomin)} - ${formatPrecio(cat.preciomax)}`}
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Link href={`/menus/categories/${cat.id}`}>
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
                      <AlertDialogTitle>Eliminar categoria</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estas seguro de eliminar la categoria &quot;{cat.nombre}&quot;?
                        {cat.totalitems && cat.totalitems > 0
                          ? ` Esta categoria tiene ${cat.totalitems} platillos activos. Debes eliminarlos o moverlos primero.`
                          : " Esta accion no se puede deshacer."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(cat.id, cat.nombre)}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Items expandidos */}
            {isExpanded && cat.items.length > 0 && (
              <div className="border-t border-border/50 bg-muted/30">
                <div className="divide-y divide-border/30">
                  {cat.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 pl-11">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{item.nombre}</span>
                          {!item.disponible && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              No disponible
                            </Badge>
                          )}
                          {item.alergenos && item.alergenos.length > 0 && (
                            <div className="flex gap-1">
                              {item.alergenos.slice(0, 3).map((a) => (
                                <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0">
                                  {a}
                                </Badge>
                              ))}
                              {item.alergenos.length > 3 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  +{item.alergenos.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        {item.descripcion && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.descripcion}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground shrink-0">
                        {item.precio > 0 ? formatPrecio(item.precio) : "S/P"}
                      </span>
                      <Link href={`/menus/items/${item.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-border/30">
                  <Link href={`/menus/items/new?categoriaid=${cat.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                      <Plus className="h-3 w-3" />
                      Agregar platillo a {cat.nombre}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {isExpanded && cat.items.length === 0 && (
              <div className="border-t border-border/50 bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Esta categoria no tiene platillos</p>
                <Link href={`/menus/items/new?categoriaid=${cat.id}`}>
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                    <Plus className="h-3 w-3" />
                    Agregar primer platillo
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
