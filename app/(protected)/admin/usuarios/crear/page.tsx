"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { crearUsuario, agregarUsuarioXHotel, eliminarUsuarioXHotel, obtenerUsuariosXHotel } from "@/app/actions/usuarios"
import { obtenerRoles } from "@/app/actions/configuraciones"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { toast } from "sonner"

interface Rol {
  id: number
  nombre: string
}

interface HotelDdl {
  value: string
  text: string
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

export default function CrearUsuarioPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Rol[]>([])
  const [saving, setSaving] = useState(false)
  const [usuarioCreado, setUsuarioCreado] = useState<number | null>(null)

  // Info básica
  const [inputNombre, setInputNombre] = useState("")
  const [inputPuesto, setInputPuesto] = useState("")
  const [inputTelefono, setInputTelefono] = useState("")
  const [inputCelular, setInputCelular] = useState("")

  // Acceso
  const [inputUsuario, setInputUsuario] = useState("")
  const [inputEmail, setInputEmail] = useState("")
  const [inputRolId, setInputRolId] = useState("")

  // Contraseña
  const [password1, setPassword1] = useState("")
  const [password2, setPassword2] = useState("")

  // Hoteles
  const [hotelesUsuario, setHotelesUsuario] = useState<UsuarioXHotel[]>([])
  const [hotelesDisponibles, setHotelesDisponibles] = useState<HotelDdl[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState("")
  const [addingHotel, setAddingHotel] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    async function loadData() {
      const [resultRoles, resultDdlHoteles] = await Promise.all([
        obtenerRoles(),
        listaDesplegableHoteles(),
      ])

      if (resultRoles.success && resultRoles.data) {
        setRoles(resultRoles.data)
      }

      if (resultDdlHoteles.success && resultDdlHoteles.data) {
        setHotelesDisponibles(resultDdlHoteles.data)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  async function loadHoteles(id: number) {
    const result = await obtenerUsuariosXHotel(id)
    if (result.success && result.data) {
      setHotelesUsuario(result.data)
    }
  }

  async function handleCrear() {
    // Validaciones
    if (!inputNombre.trim()) {
      toast.error("El nombre completo es requerido")
      return
    }
    if (!inputUsuario.trim()) {
      toast.error("El usuario es requerido")
      return
    }
    if (!inputEmail.trim()) {
      toast.error("El email es requerido")
      return
    }
    if (!inputRolId) {
      toast.error("El rol es requerido")
      return
    }
    if (!password1.trim() || !password2.trim()) {
      toast.error("Ambos campos de contraseña son requeridos")
      return
    }
    if (password1 !== password2) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setSaving(true)

    const formData = new FormData()
    formData.append("nombrecompleto", inputNombre.trim())
    formData.append("email", inputEmail.trim())
    formData.append("password", password1)
    formData.append("telefono", inputTelefono.trim())
    formData.append("celular", inputCelular.trim())
    formData.append("puesto", inputPuesto.trim())
    formData.append("usuario", inputUsuario.trim())
    formData.append("rolid", inputRolId)

    const result = await crearUsuario(formData)

    if (result.success && result.data) {
      toast.success("Usuario creado correctamente")
      setUsuarioCreado(result.data)
    } else {
      toast.error(result.error || "Error al crear usuario")
    }

    setSaving(false)
  }

  async function handleAgregarHotel() {
    if (!selectedHotelId || !usuarioCreado) {
      toast.error("Selecciona un hotel")
      return
    }

    setAddingHotel(true)
    const result = await agregarUsuarioXHotel(usuarioCreado, Number(selectedHotelId))

    if (result.success) {
      toast.success("Hotel agregado correctamente")
      setSelectedHotelId("")
      await loadHoteles(usuarioCreado)
    } else {
      toast.error(result.error)
    }
    setAddingHotel(false)
  }

  async function handleEliminarHotel(idrec: number) {
    if (!usuarioCreado) return
    setRemovingId(idrec)
    const result = await eliminarUsuarioXHotel(idrec)

    if (result.success) {
      toast.success("Hotel removido correctamente")
      await loadHoteles(usuarioCreado)
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
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Filtrar hoteles que ya tiene asignados
  const hotelesParaAgregar = hotelesDisponibles.filter(
    (h) => !hotelesUsuario.some((hu) => hu.hotelid === Number(h.value))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin/usuarios")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Usuario</h1>
          <p className="text-muted-foreground mt-1">Crear un nuevo usuario en el sistema</p>
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
              <Label htmlFor="nombrecompleto">Nombre Completo *</Label>
              <Input
                id="nombrecompleto"
                value={inputNombre}
                onChange={(e) => setInputNombre(e.target.value)}
                placeholder="Nombre completo"
                disabled={!!usuarioCreado}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="puesto">Puesto</Label>
              <Input
                id="puesto"
                value={inputPuesto}
                onChange={(e) => setInputPuesto(e.target.value)}
                placeholder="Puesto"
                disabled={!!usuarioCreado}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={inputTelefono}
                onChange={(e) => setInputTelefono(e.target.value)}
                placeholder="Teléfono"
                disabled={!!usuarioCreado}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={inputCelular}
                onChange={(e) => setInputCelular(e.target.value)}
                placeholder="Celular"
                disabled={!!usuarioCreado}
              />
            </div>
          </div>
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
              <Label htmlFor="usuario">Usuario *</Label>
              <Input
                id="usuario"
                value={inputUsuario}
                onChange={(e) => setInputUsuario(e.target.value)}
                placeholder="Nombre de usuario"
                disabled={!!usuarioCreado}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="Correo electrónico"
                disabled={!!usuarioCreado}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              <Select value={inputRolId} onValueChange={setInputRolId} disabled={!!usuarioCreado}>
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
        </CardContent>
      </Card>

      {/* Bloque: Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password1">Contraseña *</Label>
              <Input
                id="password1"
                type="password"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                placeholder="Ingresa la contraseña"
                disabled={!!usuarioCreado}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password2">Confirmar contraseña *</Label>
              <Input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Repite la contraseña"
                disabled={!!usuarioCreado}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón Crear */}
      {!usuarioCreado && (
        <div className="flex justify-end">
          <Button onClick={handleCrear} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Creando..." : "Crear Usuario"}
          </Button>
        </div>
      )}

      {/* Bloque: Hoteles - solo visible después de crear */}
      {usuarioCreado && (
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
                                  ¿Estás seguro de quitar el hotel <strong>{h.hotel}</strong> de este usuario?
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

            {/* Botón finalizar */}
            <div className="flex justify-end">
              <Button onClick={() => router.push(`/admin/usuarios/ver?id=${usuarioCreado}`)} className="gap-2">
                Ver Usuario
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
