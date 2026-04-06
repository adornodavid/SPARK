"use client"

import { useEffect, useState, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { obtenerUsuarios } from "@/app/actions/usuarios"
import { UsuariosTable } from "@/components/admin/usuarios/usuarios-table"
import { toast } from "sonner"

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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [loading, setLoading] = useState(true)

  const loadUsuarios = useCallback(async () => {
    setLoading(true)
    const result = await obtenerUsuarios()

    if (result.success && result.data) {
      setUsuarios(result.data as UsuarioRow[])
    } else {
      toast.error(result.error || "Error al cargar usuarios")
      setUsuarios([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsuarios()
  }, [loadUsuarios])

  const totalUsuarios = usuarios.length
  const activos = usuarios.filter((u) => u.activo === true || u.activo === "true").length
  const inactivos = usuarios.filter((u) => u.activo === false || u.activo === "false").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground mt-1">Gestión de usuarios del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadUsuarios} title="Actualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Usuarios</p>
          <p className="text-2xl font-bold">{totalUsuarios}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="text-2xl font-bold text-emerald-600">{activos}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-sm text-muted-foreground">Inactivos</p>
          <p className="text-2xl font-bold text-red-600">{inactivos}</p>
        </div>
      </div>

      {/* Tabla */}
      <UsuariosTable usuarios={usuarios} loading={loading} onUpdate={loadUsuarios} />
    </div>
  )
}
