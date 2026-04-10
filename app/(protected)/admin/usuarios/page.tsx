"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { obtenerUsuarios } from "@/app/actions/usuarios"
import { obtenerRoles } from "@/app/actions/configuraciones"
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

interface Rol {
  id: number
  nombre: string
}

export default function UsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Rol[]>([])

  // Filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState("")
  const [filtroRolId, setFiltroRolId] = useState("Todos")
  const [filtroEstatus, setFiltroEstatus] = useState("Todos")

  useEffect(() => {
    async function loadRoles() {
      const result = await obtenerRoles()
      if (result.success && result.data) {
        setRoles(result.data)
      }
    }
    loadRoles()
  }, [])

  const loadUsuarios = useCallback(async (busqueda = "", rolid = -1, activo = "Todos") => {
    setLoading(true)
    const result = await obtenerUsuarios(-1, busqueda, rolid, activo)

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

  function handleBuscar() {
    const rolid = filtroRolId === "Todos" ? -1 : Number(filtroRolId)
    loadUsuarios(filtroBusqueda.trim(), rolid, filtroEstatus)
  }

  function handleLimpiar() {
    setFiltroBusqueda("")
    setFiltroRolId("Todos")
    setFiltroEstatus("Todos")
    loadUsuarios()
  }

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
          <Button variant="outline" size="icon" onClick={() => handleBuscar()} title="Actualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => router.push("/admin/usuarios/crear")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground">Buscar</label>
            <Input
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              placeholder="Nombre, usuario o email..."
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
            />
          </div>
          <div className="space-y-1 w-[180px]">
            <label className="text-xs text-muted-foreground">Rol</label>
            <Select value={filtroRolId} onValueChange={setFiltroRolId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {roles.map((rol) => (
                  <SelectItem key={rol.id} value={rol.id.toString()}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-[150px]">
            <label className="text-xs text-muted-foreground">Estatus</label>
            <Select value={filtroEstatus} onValueChange={setFiltroEstatus}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleBuscar} className="h-9 gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          <Button variant="outline" onClick={handleLimpiar} className="h-9 gap-2">
            <X className="h-4 w-4" />
            Limpiar
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
      <UsuariosTable usuarios={usuarios} loading={loading} onUpdate={handleBuscar} />
    </div>
  )
}
