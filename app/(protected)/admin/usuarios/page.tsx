"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { obtenerUsuarios } from "@/app/actions/usuarios"
import { obtenerRoles } from "@/app/actions/configuraciones"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { obtenerSesion } from "@/app/actions/session"
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
  hotelid: number | null
  hotel: string | null
  ultimoingreso: string | null
  activo: boolean | string
  imgurl: string | null
}

interface Rol {
  id: number
  nombre: string
}

interface HotelItem {
  value: string
  text: string
}

export default function UsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Rol[]>([])
  const [hoteles, setHoteles] = useState<HotelItem[]>([])
  const [sesionRolId, setSesionRolId] = useState<number>(0)

  // Filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState("")
  const [filtroRolId, setFiltroRolId] = useState("Todos")
  const [filtroEstatus, setFiltroEstatus] = useState("Todos")
  const [filtroHotelId, setFiltroHotelId] = useState("Todos")

  // Roles ocultos según el rol de la sesión (no pueden ver estos rolids)
  // 1 SuperAdmin: ninguno oculto | 2 Admin: oculta 1 | 3 Gerente: oculta 1,2 | 4 Asesor: oculta 1,2,3
  const rolesOcultos = (() => {
    if (sesionRolId === 2) return new Set([1])
    if (sesionRolId === 3) return new Set([1, 2])
    if (sesionRolId === 4) return new Set([1, 2, 3])
    return new Set<number>()
  })()

  useEffect(() => {
    async function loadInicial() {
      const [resultRoles, resultHoteles, sesion] = await Promise.all([
        obtenerRoles(),
        listaDesplegableHoteles(-1, "", true),
        obtenerSesion(),
      ])
      if (resultRoles.success && resultRoles.data) {
        setRoles(resultRoles.data)
      }
      if (resultHoteles.success && resultHoteles.data) {
        setHoteles(resultHoteles.data)
      }
      if (sesion) {
        setSesionRolId(Number(sesion.RolId) || 0)
      }
    }
    loadInicial()
  }, [])

  const loadUsuarios = useCallback(
    async (busqueda = "", rolid = -1, activo = "Todos", hotelid = -1) => {
      setLoading(true)
      const result = await obtenerUsuarios(-1, busqueda, rolid, activo, hotelid)

      if (result.success && result.data) {
        setUsuarios(result.data as UsuarioRow[])
      } else {
        toast.error(result.error || "Error al cargar usuarios")
        setUsuarios([])
      }
      setLoading(false)
    },
    [],
  )

  // Auto-búsqueda con debounce al cambiar cualquier filtro
  useEffect(() => {
    const timer = setTimeout(() => {
      const rolid = filtroRolId === "Todos" ? -1 : Number(filtroRolId)
      const hotelid = filtroHotelId === "Todos" ? -1 : Number(filtroHotelId)
      loadUsuarios(filtroBusqueda.trim(), rolid, filtroEstatus, hotelid)
    }, 300)
    return () => clearTimeout(timer)
  }, [filtroBusqueda, filtroRolId, filtroEstatus, filtroHotelId, loadUsuarios])

  function handleBuscar() {
    const rolid = filtroRolId === "Todos" ? -1 : Number(filtroRolId)
    const hotelid = filtroHotelId === "Todos" ? -1 : Number(filtroHotelId)
    loadUsuarios(filtroBusqueda.trim(), rolid, filtroEstatus, hotelid)
  }

  function handleLimpiar() {
    setFiltroBusqueda("")
    setFiltroRolId("Todos")
    setFiltroEstatus("Todos")
    setFiltroHotelId("Todos")
  }

  const usuariosVisibles = usuarios.filter((u) => !rolesOcultos.has(Number(u.rolid)))
  const rolesVisibles = roles.filter((r) => !rolesOcultos.has(r.id))

  const totalUsuarios = usuariosVisibles.length
  const activos = usuariosVisibles.filter((u) => u.activo === true || u.activo === "true").length
  const inactivos = usuariosVisibles.filter((u) => u.activo === false || u.activo === "false").length

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
                {rolesVisibles.map((rol) => (
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
          <div className="space-y-1 w-[220px]">
            <label className="text-xs text-muted-foreground">Hoteles</label>
            <Select value={filtroHotelId} onValueChange={setFiltroHotelId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {hoteles.map((hotel) => (
                  <SelectItem key={hotel.value} value={hotel.value}>
                    {hotel.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleBuscar} className="hidden h-9 gap-2">
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
      <UsuariosTable usuarios={usuariosVisibles} loading={loading} onUpdate={handleBuscar} />
    </div>
  )
}
