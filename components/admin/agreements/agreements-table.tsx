"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
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
import { eliminarConvenio } from "@/app/actions/convenios"
import type { oConvenio } from "@/types/convenios"
import { ESTADO_CONFIG } from "@/types/convenios"

interface AgreementsTableProps {
  convenios: oConvenio[]
  loading: boolean
  onUpdate: () => void
}

function formatDescuento(convenio: oConvenio): string {
  if (convenio.tipo_descuento === "porcentaje") {
    return `${convenio.descuento_valor}%`
  }
  return `$${Number(convenio.descuento_valor).toLocaleString("es-MX")} MXN`
}

function formatAplicaA(aplica_a: string): string {
  const labels: Record<string, string> = {
    habitaciones: "Habitaciones",
    salones: "Salones",
    ambos: "Ambos",
  }
  return labels[aplica_a] || aplica_a
}

function StatusBadge({ estado }: { estado: string }) {
  const config = ESTADO_CONFIG[estado]
  if (!config) return <span>{estado}</span>

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  )
}

export function AgreementsTable({ convenios, loading, onUpdate }: AgreementsTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function handleDelete(id: number) {
    setDeletingId(id)
    const result = await eliminarConvenio(id)

    if (result.success) {
      toast.success("Convenio eliminado correctamente")
      onUpdate()
    } else {
      toast.error(result.error || "Error al eliminar el convenio")
    }
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8">
        <div className="flex items-center justify-center text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mr-3" />
          Cargando convenios...
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead>Empresa</TableHead>
            <TableHead>Hotel</TableHead>
            <TableHead>Descuento</TableHead>
            <TableHead>Aplica a</TableHead>
            <TableHead>Vigencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Version</TableHead>
            <TableHead className="w-36 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {convenios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                No hay convenios registrados
              </TableCell>
            </TableRow>
          ) : (
            convenios.map((convenio) => (
              <TableRow key={convenio.id} className="border-border/50">
                <TableCell>
                  <div>
                    <p className="font-medium">{convenio.empresa}</p>
                    {convenio.contacto && (
                      <p className="text-sm text-muted-foreground">{convenio.contacto}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{convenio.hotel || "Sin hotel"}</TableCell>
                <TableCell>
                  <span className="font-semibold">{formatDescuento(convenio)}</span>
                </TableCell>
                <TableCell className="text-sm">{formatAplicaA(convenio.aplica_a)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{new Date(convenio.vigencia_inicio).toLocaleDateString("es-MX")}</p>
                    <p className="text-muted-foreground">
                      al {new Date(convenio.vigencia_fin).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge estado={convenio.estado} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  v{convenio.version}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Link href={`/agreements/${convenio.id}`}>
                      <Button variant="ghost" size="icon" title="Ver detalle" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/agreements/${convenio.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Editar" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Eliminar"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deletingId === convenio.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar convenio</AlertDialogTitle>
                          <AlertDialogDescription>
                            Estas a punto de eliminar el convenio con <strong>{convenio.empresa}</strong>.
                            Esta accion no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(convenio.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
