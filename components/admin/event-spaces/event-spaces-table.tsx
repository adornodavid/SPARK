"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface EventSpace {
  id: string
  hotelid: string
  hotel: string
  nombre: string
  descripcion: string
  longitud: number | null
  ancho: number | null
  altura: number | null
  aream2: number | null
}

interface EventSpacesTableProps {
  eventSpaces: EventSpace[]
}

export function EventSpacesTable({ eventSpaces }: EventSpacesTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase.from("event_spaces").delete().eq("id", deleteId)

    if (error) {
      toast.error("Error al eliminar el salón")
    } else {
      router.refresh()
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  return (
    <>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hotel</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Longitud</TableHead>
              <TableHead>Ancho</TableHead>
              <TableHead>Altura</TableHead>
              <TableHead>Área m²</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventSpaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No hay salones registrados
                </TableCell>
              </TableRow>
            ) : (
              eventSpaces.map((space) => (
                <TableRow key={space.id}>
                  <TableCell className="font-medium">{space.hotel}</TableCell>
                  <TableCell className="font-medium">{space.nombre}</TableCell>
                  <TableCell className="max-w-xs truncate">{space.descripcion || "—"}</TableCell>
                  <TableCell>{space.longitud ? `${space.longitud} m` : "—"}</TableCell>
                  <TableCell>{space.ancho ? `${space.ancho} m` : "—"}</TableCell>
                  <TableCell>{space.altura ? `${space.altura} m` : "—"}</TableCell>
                  <TableCell>{space.aream2 ? `${space.aream2} m²` : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm" title="Ver detalle">
                        <Link href={`/salones/${space.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" title="Editar">
                        <Link href={`/salones/${space.id}/editar`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(space.id)}>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el salón de eventos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
