"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye } from "lucide-react"
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

interface Client {
  id: string
  type: string
  company_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  assigned_to_user: {
    first_name: string
    last_name: string
  } | null
}

interface ClientsTableProps {
  clients: Client[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase.from("clients").delete().eq("id", deleteId)

    if (error) {
      toast.error("Error al eliminar el cliente")
    } else {
      router.refresh()
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  const getClientName = (client: Client) => {
    if (client.type === "empresa" && client.company_name) {
      return client.company_name
    }
    return `${client.first_name || ""} ${client.last_name || ""}`.trim() || "Sin nombre"
  }

  const getClientSubtext = (client: Client) => {
    if (client.type === "empresa" && client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`
    }
    return null
  }

  return (
    <>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay clientes registrados
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getClientName(client)}</div>
                      {getClientSubtext(client) && (
                        <div className="text-sm text-muted-foreground">{getClientSubtext(client)}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.type === "empresa" ? "default" : "outline"}>
                      {client.type === "empresa" ? "Empresa" : "Individual"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{client.email || "—"}</div>
                      {client.phone && <div className="text-muted-foreground">{client.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{client.city || "—"}</TableCell>
                  <TableCell>
                    {client.assigned_to_user
                      ? `${client.assigned_to_user.first_name} ${client.assigned_to_user.last_name}`
                      : "Sin asignar"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/clientes/${client.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/clientes/${client.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(client.id)}>
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente y todos sus datos asociados
              (contactos, documentos, actividades).
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
