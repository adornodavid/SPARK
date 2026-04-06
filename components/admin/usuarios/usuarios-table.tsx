"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Pencil, Ban, Trash2 } from "lucide-react"
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
import { estatusActivoUsuario } from "@/app/actions/usuarios"

interface UsuarioRow {
  usuarioid: number
  nombrecompleto: string
  usuario: string
  email: string
  telefono: string | null
  celular: string | null
  puesto: string | null
  rol: string
  rolid: number
  ultimoingreso: string | null
  activo: boolean | string
  imgurl: string | null
}

function isActivo(activo: boolean | string): boolean {
  return activo === true || activo === "true"
}

interface UsuariosTableProps {
  usuarios: UsuarioRow[]
  loading: boolean
  onUpdate: () => void
}

export function UsuariosTable({ usuarios, loading, onUpdate }: UsuariosTableProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<number | null>(null)

  async function handleInactivar(id: number, activo: boolean) {
    setProcessingId(id)
    const result = await estatusActivoUsuario(id, !activo)

    if (result.success) {
      toast.success(activo ? "Usuario inactivado correctamente" : "Usuario activado correctamente")
      onUpdate()
    } else {
      toast.error(result.error || "Error al cambiar estatus del usuario")
    }
    setProcessingId(null)
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8">
        <div className="flex items-center justify-center text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mr-3" />
          Cargando usuarios...
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead>Nombre</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Celular</TableHead>
            <TableHead>Puesto</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estatus</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                No hay usuarios registrados
              </TableCell>
            </TableRow>
          ) : (
            usuarios.map((usuario) => (
              <TableRow key={usuario.usuarioid} className="border-border/50">
                <TableCell>
                  <p className="font-medium">{usuario.nombrecompleto}</p>
                </TableCell>
                <TableCell className="text-sm">{usuario.usuario}</TableCell>
                <TableCell className="text-sm">{usuario.email}</TableCell>
                <TableCell className="text-sm">{usuario.telefono || "—"}</TableCell>
                <TableCell className="text-sm">{usuario.celular || "—"}</TableCell>
                <TableCell className="text-sm">{usuario.puesto || "—"}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                    {usuario.rol}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      isActivo(usuario.activo)
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                    }`}
                  >
                    {isActivo(usuario.activo) ? "Activo" : "Inactivo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-3">
                    {/* Ver */}
                    <button
                      onClick={() => router.push(`/admin/usuarios/ver?id=${usuario.usuarioid}`)}
                      className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
                      title="Ver"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-[10px]">Ver</span>
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => router.push(`/admin/usuarios/editar?id=${usuario.usuarioid}`)}
                      className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="text-[10px]">Editar</span>
                    </button>

                    {/* Inactivar/Activar */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className={`flex flex-col items-center gap-0.5 transition-colors ${
                            isActivo(usuario.activo)
                              ? "text-muted-foreground hover:text-amber-600"
                              : "text-muted-foreground hover:text-emerald-600"
                          }`}
                          title={isActivo(usuario.activo) ? "Inactivar" : "Activar"}
                          disabled={processingId === usuario.usuarioid}
                        >
                          <Ban className="h-4 w-4" />
                          <span className="text-[10px]">{isActivo(usuario.activo) ? "Inactivar" : "Activar"}</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {isActivo(usuario.activo) ? "Inactivar usuario" : "Activar usuario"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {isActivo(usuario.activo)
                              ? <>¿Estás seguro de inactivar a <strong>{usuario.nombrecompleto}</strong>? El usuario no podrá acceder al sistema.</>
                              : <>¿Estás seguro de activar a <strong>{usuario.nombrecompleto}</strong>? El usuario podrá acceder al sistema nuevamente.</>
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleInactivar(usuario.usuarioid, isActivo(usuario.activo))}
                            className={isActivo(usuario.activo)
                              ? "bg-amber-600 text-white hover:bg-amber-700"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }
                          >
                            {isActivo(usuario.activo) ? "Inactivar" : "Activar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Eliminar - oculto por ahora */}
                    {false && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar"
                          disabled={processingId === usuario.usuarioid}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-[10px]">Eliminar</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de eliminar a <strong>{usuario.nombrecompleto}</strong>? Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    )}
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
