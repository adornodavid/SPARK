"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { ArrowLeft, KeyRound, Lock, Save, Hotel, Plus, Trash2, User } from "lucide-react"
import {
  obtenerUsuarioDetalle,
  actualizarInfoBasicaUsuario,
  actualizarAccesoUsuario,
  actualizarPasswordUsuario,
  obtenerUsuariosXHotel,
  agregarUsuarioXHotel,
  eliminarUsuarioXHotel,
} from "@/app/actions/usuarios"
import { obtenerRoles } from "@/app/actions/configuraciones"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { obtenerSesion } from "@/app/actions/session"
import { toast } from "sonner"

interface UsuarioDetalle {
  usuarioid: number
  nombrecompleto: string
  usuario: string
  email: string
  telefono: string | null
  celular: string | null
  puesto: string | null
  imgurl: string | null
  rol: string
  rolid: number
  activo: boolean | string
  ultimoingreso: string | null
  fechacreacion: string | null
  hoteles: { hotelid: number; nombre: string }[]
}

interface Rol {
  id: number
  nombre: string
}

interface UsuarioXHotel {
  idrec: number
  usuarioid: number
  usuario: string
  hotelid: number
  acronimo: string
  hotel: string
  activo: boolean
}

interface HotelDdl {
  value: string
  text: string
}

export default function EditarUsuarioPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = Number(searchParams.get("id"))

  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null)
  const [roles, setRoles] = useState<Rol[]>([])
  const [sesionRolId, setSesionRolId] = useState<number>(0)
  const [sesionUsuarioId, setSesionUsuarioId] = useState<number>(0)

  // Info básica form
  const [inputNombre, setInputNombre] = useState("")
  const [inputPuesto, setInputPuesto] = useState("")
  const [inputTelefono, setInputTelefono] = useState("")
  const [inputCelular, setInputCelular] = useState("")
  const [savingInfo, setSavingInfo] = useState(false)

  // Acceso form
  const [inputUsuario, setInputUsuario] = useState("")
  const [inputEmail, setInputEmail] = useState("")
  const [inputRolId, setInputRolId] = useState("")
  const [savingAcceso, setSavingAcceso] = useState(false)

  // Password form
  const [password1, setPassword1] = useState("")
  const [password2, setPassword2] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  // Hoteles
  const [hotelesUsuario, setHotelesUsuario] = useState<UsuarioXHotel[]>([])
  const [hotelesDisponibles, setHotelesDisponibles] = useState<HotelDdl[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState("")
  const [addingHotel, setAddingHotel] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  async function loadHoteles() {
    const result = await obtenerUsuariosXHotel(id)
    if (result.success && result.data) {
      setHotelesUsuario(result.data)
    }
  }

  useEffect(() => {
    if (!id || isNaN(id)) {
      router.push("/admin/usuarios")
      return
    }

    async function loadData() {
      const [resultUsuario, resultRoles, resultHoteles, resultDdlHoteles, sesion] = await Promise.all([
        obtenerUsuarioDetalle(id),
        obtenerRoles(),
        obtenerUsuariosXHotel(id),
        listaDesplegableHoteles(),
        obtenerSesion(),
      ])

      if (sesion) {
        setSesionRolId(Number(sesion.RolId) || 0)
        setSesionUsuarioId(Number(sesion.UsuarioId) || 0)
      }

      if (resultUsuario.success && resultUsuario.data) {
        setUsuario(resultUsuario.data)
        setInputNombre(resultUsuario.data.nombrecompleto || "")
        setInputPuesto(resultUsuario.data.puesto || "")
        setInputTelefono(resultUsuario.data.telefono || "")
        setInputCelular(resultUsuario.data.celular || "")
        setInputUsuario(resultUsuario.data.usuario || "")
        setInputEmail(resultUsuario.data.email || "")
        setInputRolId(resultUsuario.data.rolid?.toString() || "")
      } else {
        toast.error(resultUsuario.error || "Error al cargar usuario")
        router.push("/admin/usuarios")
      }

      if (resultRoles.success && resultRoles.data) {
        setRoles(resultRoles.data)
      }

      if (resultHoteles.success && resultHoteles.data) {
        setHotelesUsuario(resultHoteles.data)
      }

      if (resultDdlHoteles.success && resultDdlHoteles.data) {
        setHotelesDisponibles(resultDdlHoteles.data)
      }

      setLoading(false)
    }

    loadData()
  }, [id, router])

  async function handleActualizarInfo() {
    if (!inputNombre.trim()) {
      toast.error("El nombre completo es requerido")
      return
    }

    setSavingInfo(true)
    const result = await actualizarInfoBasicaUsuario(id, inputNombre, inputPuesto, inputTelefono, inputCelular)

    if (result.success) {
      toast.success("Información actualizada correctamente")
    } else {
      toast.error(result.error)
    }
    setSavingInfo(false)
  }

  async function handleActualizarAcceso() {
    if (!inputUsuario.trim() && !inputEmail.trim()) {
      toast.error("Al menos Usuario o Email debe tener datos")
      return
    }

    setSavingAcceso(true)
    const result = await actualizarAccesoUsuario(id, inputUsuario.trim(), inputEmail.trim(), Number(inputRolId))

    if (result.success) {
      toast.success("Datos de acceso actualizados correctamente")
    } else {
      toast.error(result.error)
    }
    setSavingAcceso(false)
  }

  async function handleActualizarPassword() {
    if (!password1.trim() || !password2.trim()) {
      toast.error("Ambos campos de contraseña son requeridos")
      return
    }
    if (password1 !== password2) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setSavingPassword(true)
    const result = await actualizarPasswordUsuario(id, password1)

    if (result.success) {
      toast.success("Contraseña actualizada correctamente")
      setPassword1("")
      setPassword2("")
    } else {
      toast.error(result.error)
    }
    setSavingPassword(false)
  }

  async function handleAgregarHotel() {
    if (!selectedHotelId) {
      toast.error("Selecciona un hotel")
      return
    }

    setAddingHotel(true)
    const result = await agregarUsuarioXHotel(id, Number(selectedHotelId))

    if (result.success) {
      toast.success("Hotel agregado correctamente")
      setSelectedHotelId("")
      await loadHoteles()
    } else {
      toast.error(result.error)
    }
    setAddingHotel(false)
  }

  async function handleEliminarHotel(idrec: number) {
    setRemovingId(idrec)
    const result = await eliminarUsuarioXHotel(idrec)

    if (result.success) {
      toast.success("Hotel removido correctamente")
      await loadHoteles()
    } else {
      toast.error(result.error)
    }
    setRemovingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando usuario...</p>
        </div>
      </div>
    )
  }

  if (!usuario) return null

  // Permisos por rol
  const esRolAdmin = sesionRolId === 1 || sesionRolId === 2
  const esUsuarioPropio = sesionUsuarioId === id
  const puedeEditarAcceso = esRolAdmin
  const puedeEditarPassword = esRolAdmin || esUsuarioPropio

  // Filtrar hoteles que ya tiene asignados
  const hotelesParaAgregar = hotelesDisponibles.filter(
    (h) => !hotelesUsuario.some((hu) => hu.hotelid === Number(h.value))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push(`/admin/usuarios/ver?id=${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar: {usuario.nombrecompleto}</h1>
          <p className="text-muted-foreground mt-1">Modificar datos del usuario</p>
        </div>
      </div>

      {/* Bloque: Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombrecompleto">Nombre Completo</Label>
              <Input
                id="nombrecompleto"
                value={inputNombre}
                onChange={(e) => setInputNombre(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="puesto">Puesto</Label>
              <Input
                id="puesto"
                value={inputPuesto}
                onChange={(e) => setInputPuesto(e.target.value)}
                placeholder="Puesto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={inputTelefono}
                onChange={(e) => setInputTelefono(e.target.value)}
                placeholder="Teléfono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={inputCelular}
                onChange={(e) => setInputCelular(e.target.value)}
                placeholder="Celular"
              />
            </div>
          </div>
          <Button onClick={handleActualizarInfo} disabled={savingInfo} className="gap-2">
            <Save className="h-4 w-4" />
            {savingInfo ? "Actualizando..." : "Actualizar"}
          </Button>
        </CardContent>
      </Card>

      {/* Bloque: Acceso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-primary" />
            Acceso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <Input
                id="usuario"
                value={inputUsuario}
                onChange={(e) => setInputUsuario(e.target.value)}
                placeholder="Nombre de usuario"
                disabled={!puedeEditarAcceso}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="Correo electrónico"
                disabled={!puedeEditarAcceso}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select value={inputRolId} onValueChange={setInputRolId} disabled={!puedeEditarAcceso}>
                <SelectTrigger id="rol">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {puedeEditarAcceso && (
            <Button onClick={handleActualizarAcceso} disabled={savingAcceso} className="gap-2">
              <Save className="h-4 w-4" />
              {savingAcceso ? "Actualizando..." : "Actualizar"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Bloque: Cambiar Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password1">Nueva contraseña</Label>
              <Input
                id="password1"
                type="password"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                placeholder="Ingresa la nueva contraseña"
                disabled={!puedeEditarPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password2">Confirmar contraseña</Label>
              <Input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Repite la nueva contraseña"
                disabled={!puedeEditarPassword}
              />
            </div>
          </div>
          {puedeEditarPassword && (
            <Button onClick={handleActualizarPassword} disabled={savingPassword} className="gap-2">
              <Lock className="h-4 w-4" />
              {savingPassword ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Bloque: Hoteles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="h-5 w-5 text-primary" />
            Hoteles Asignados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agregar hotel */}
          <div className="flex items-end gap-3">
            <div className="space-y-2 flex-1 max-w-sm">
              <Label htmlFor="hotel">Agregar hotel</Label>
              <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                <SelectTrigger id="hotel">
                  <SelectValue placeholder="Seleccionar hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotelesParaAgregar.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>
                      {hotel.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAgregarHotel} disabled={addingHotel || !selectedHotelId} className="gap-2">
              <Plus className="h-4 w-4" />
              {addingHotel ? "Agregando..." : "Agregar"}
            </Button>
          </div>

          {/* Tabla de hoteles */}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Acrónimo</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotelesUsuario.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No tiene hoteles asignados
                    </TableCell>
                  </TableRow>
                ) : (
                  hotelesUsuario.map((h) => (
                    <TableRow key={h.idrec} className="border-border/50">
                      <TableCell className="font-medium">{h.acronimo}</TableCell>
                      <TableCell>{h.hotel}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            h.activo
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                          }`}
                        >
                          {h.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-destructive transition-colors mx-auto"
                              title="Quitar hotel"
                              disabled={removingId === h.idrec}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="text-[10px]">Quitar</span>
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Quitar hotel</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de quitar el hotel <strong>{h.hotel}</strong> de este usuario? El usuario ya no tendrá acceso a este hotel.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleEliminarHotel(h.idrec)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Quitar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
