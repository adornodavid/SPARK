"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, KeyRound, Lock, Save, Hotel, User, CheckCircle2, XCircle } from "lucide-react"
import {
  obtenerUsuarioDetalle,
  actualizarInfoBasicaUsuario,
  actualizarAccesoUsuario,
  actualizarPasswordUsuario,
  obtenerUsuariosXHotel,
  agregarUsuarioXHotel,
  eliminarUsuarioXHotel,
  validarUsuarioUnico,
} from "@/app/actions/usuarios"
import { obtenerRoles } from "@/app/actions/configuraciones"
import { listaHotelesParaAsignacion } from "@/app/actions/hoteles"
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
  hotelid: number | null
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

interface HotelAsignable {
  value: string
  text: string
  activo: boolean
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
  const [inputHotelId, setInputHotelId] = useState("")
  const [savingInfo, setSavingInfo] = useState(false)

  // Acceso form
  const [inputUsuario, setInputUsuario] = useState("")
  const [inputEmail, setInputEmail] = useState("")
  const [inputRolId, setInputRolId] = useState("")
  const [savingAcceso, setSavingAcceso] = useState(false)

  // Validaciones usuario / email
  const [usuarioValidado, setUsuarioValidado] = useState<null | boolean>(null)
  const [emailValidado, setEmailValidado] = useState<null | boolean>(null)
  const [validandoUsuario, setValidandoUsuario] = useState(false)
  const [validandoEmail, setValidandoEmail] = useState(false)

  // Password form
  const [password1, setPassword1] = useState("")
  const [password2, setPassword2] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  // Hoteles
  const [hotelesUsuario, setHotelesUsuario] = useState<UsuarioXHotel[]>([])
  const [hotelesDisponibles, setHotelesDisponibles] = useState<HotelAsignable[]>([])
  const [hotelesSeleccionadosLocal, setHotelesSeleccionadosLocal] = useState<Set<number>>(new Set())
  const [savingHoteles, setSavingHoteles] = useState(false)

  async function loadHoteles() {
    const result = await obtenerUsuariosXHotel(id)
    if (result.success && result.data) {
      setHotelesUsuario(result.data)
      setHotelesSeleccionadosLocal(new Set(result.data.map((h) => h.hotelid)))
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
        listaHotelesParaAsignacion(),
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

        // Hotel principal: usa hotelid del usuario, o primer hotel disponible si es NULL
        if (resultUsuario.data.hotelid != null) {
          setInputHotelId(String(resultUsuario.data.hotelid))
        } else if (resultDdlHoteles.success && resultDdlHoteles.data && resultDdlHoteles.data.length > 0) {
          setInputHotelId(resultDdlHoteles.data[0].value)
        }

        // Auto-validar usuario/email cargados (excluyendo al propio usuario editado)
        if (resultUsuario.data.usuario) {
          const r = await validarUsuarioUnico("usuario", resultUsuario.data.usuario, id)
          if (r.success) setUsuarioValidado(!r.existe)
        }
        if (resultUsuario.data.email) {
          const r = await validarUsuarioUnico("email", resultUsuario.data.email, id)
          if (r.success) setEmailValidado(!r.existe)
        }
      } else {
        toast.error(resultUsuario.error || "Error al cargar usuario")
        router.push("/admin/usuarios")
      }

      if (resultRoles.success && resultRoles.data) {
        setRoles(resultRoles.data)
      }

      if (resultHoteles.success && resultHoteles.data) {
        setHotelesUsuario(resultHoteles.data)
        setHotelesSeleccionadosLocal(new Set(resultHoteles.data.map((h) => h.hotelid)))
      }

      if (resultDdlHoteles.success && resultDdlHoteles.data) {
        setHotelesDisponibles(resultDdlHoteles.data)
      }

      setLoading(false)
    }

    loadData()
  }, [id, router])

  // Reset validación cuando cambia el input
  useEffect(() => { setUsuarioValidado(null) }, [inputUsuario])
  useEffect(() => { setEmailValidado(null) }, [inputEmail])

  async function handleActualizarInfo() {
    if (!inputNombre.trim()) {
      toast.error("El nombre completo es requerido")
      return
    }

    setSavingInfo(true)
    const hotelIdNum = inputHotelId && inputHotelId.trim() !== "" ? Number(inputHotelId) : null
    const result = await actualizarInfoBasicaUsuario(id, inputNombre, inputPuesto, inputTelefono, inputCelular, hotelIdNum)

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

  function handleToggleHotelLocal(hotelIdStr: string) {
    const hotelIdNum = Number(hotelIdStr)
    setHotelesSeleccionadosLocal((prev) => {
      const next = new Set(prev)
      if (next.has(hotelIdNum)) next.delete(hotelIdNum)
      else next.add(hotelIdNum)
      return next
    })
  }

  function handleSeleccionarTodos() {
    setHotelesSeleccionadosLocal(new Set(hotelesDisponibles.map((h) => Number(h.value))))
  }

  function handleDeseleccionarTodos() {
    setHotelesSeleccionadosLocal(new Set())
  }

  async function handleActualizarHoteles() {
    setSavingHoteles(true)
    const asignadosActuales = new Map(hotelesUsuario.map((h) => [h.hotelid, h]))
    const seleccionados = hotelesSeleccionadosLocal

    // Insertar: los seleccionados que no están en la tabla
    const paraInsertar: number[] = []
    seleccionados.forEach((hotelId) => {
      if (!asignadosActuales.has(hotelId)) paraInsertar.push(hotelId)
    })

    // Borrar: los que están en la tabla pero ya no están seleccionados
    const paraBorrar: { idrec: number; hotel: string }[] = []
    asignadosActuales.forEach((row, hotelId) => {
      if (!seleccionados.has(hotelId)) paraBorrar.push({ idrec: row.idrec, hotel: row.hotel })
    })

    let errores = 0
    for (const hotelId of paraInsertar) {
      const r = await agregarUsuarioXHotel(id, hotelId)
      if (!r.success) {
        errores++
        toast.error(`Al agregar hotel ${hotelId}: ${r.error}`)
      }
    }
    for (const item of paraBorrar) {
      const r = await eliminarUsuarioXHotel(item.idrec)
      if (!r.success) {
        errores++
        toast.error(`Al quitar ${item.hotel}: ${r.error}`)
      }
    }

    await loadHoteles()
    if (errores === 0) {
      toast.success(
        `Hoteles actualizados correctamente (${paraInsertar.length} agregado${paraInsertar.length === 1 ? "" : "s"}, ${paraBorrar.length} removido${paraBorrar.length === 1 ? "" : "s"})`
      )
    }
    setSavingHoteles(false)
  }

  async function handleValidarUsuario() {
    if (inputUsuario.trim().length < 3) {
      toast.error("El usuario debe tener al menos 3 caracteres")
      return
    }
    setValidandoUsuario(true)
    const result = await validarUsuarioUnico("usuario", inputUsuario.trim(), id)
    if (result.success) {
      setUsuarioValidado(!result.existe)
    } else {
      toast.error(result.error)
    }
    setValidandoUsuario(false)
  }

  async function handleValidarEmail() {
    if (inputEmail.trim().length < 3) {
      toast.error("El email debe tener al menos 3 caracteres")
      return
    }
    setValidandoEmail(true)
    const result = await validarUsuarioUnico("email", inputEmail.trim(), id)
    if (result.success) {
      setEmailValidado(!result.existe)
    } else {
      toast.error(result.error)
    }
    setValidandoEmail(false)
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

  // Si el rol del usuario editado coincide con el de la sesión, se muestra esa única
  // opción y el Select queda deshabilitado (no puedes cambiar a alguien de tu mismo rango).
  const mismoRolQueSesion = sesionRolId > 0 && Number(inputRolId) === sesionRolId

  // Roles que puede asignar el usuario que inició sesión
  // 1=SuperAdmin: todos | 2=Administrador: [3,4] | 3=Gerente: [4] | 4=Asesor: [4]
  const rolesPermitidos = (() => {
    if (mismoRolQueSesion) return roles.filter((r) => r.id === sesionRolId)
    if (sesionRolId === 1) return roles
    if (sesionRolId === 2) return roles.filter((r) => r.id === 3 || r.id === 4)
    return roles.filter((r) => r.id === 4)
  })()

  const rolSelectDisabled = !puedeEditarAcceso || mismoRolQueSesion

  // Habilitar botón "Actualizar" de Acceso solo con validaciones OK
  const usuarioOk = inputUsuario.trim().length === 0 || usuarioValidado === true
  const emailOk = inputEmail.trim().length === 0 || emailValidado === true
  const puedeActualizarAcceso = puedeEditarAcceso && usuarioOk && emailOk

  // Diff local vs servidor para habilitar botón "Actualizar" de Hoteles
  const asignadosServidorSet = new Set(hotelesUsuario.map((h) => h.hotelid))
  const hayCambiosHoteles =
    asignadosServidorSet.size !== hotelesSeleccionadosLocal.size ||
    [...hotelesSeleccionadosLocal].some((hId) => !asignadosServidorSet.has(hId))

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
              <Label htmlFor="hotelPrincipal">Hotel</Label>
              <Select value={inputHotelId} onValueChange={setInputHotelId}>
                <SelectTrigger id="hotelPrincipal">
                  <SelectValue placeholder="Seleccionar hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotelesDisponibles.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>
                      {hotel.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            {/* Usuario con Validar */}
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <div className="flex gap-2">
                <Input
                  id="usuario"
                  value={inputUsuario}
                  onChange={(e) => setInputUsuario(e.target.value)}
                  placeholder="Nombre de usuario"
                  disabled={!puedeEditarAcceso}
                  className={usuarioValidado === false ? "border-red-500" : usuarioValidado === true ? "border-emerald-500" : ""}
                />
                <Button
                  type="button"
                  variant={usuarioValidado === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleValidarUsuario}
                  disabled={!puedeEditarAcceso || validandoUsuario || inputUsuario.trim().length < 3}
                  className="shrink-0"
                >
                  {validandoUsuario ? "..." : "Validar"}
                </Button>
              </div>
              {usuarioValidado === false && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Este usuario ya existe
                </p>
              )}
              {usuarioValidado === true && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Usuario disponible
                </p>
              )}
            </div>

            {/* Email con Validar */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  disabled={!puedeEditarAcceso}
                  className={emailValidado === false ? "border-red-500" : emailValidado === true ? "border-emerald-500" : ""}
                />
                <Button
                  type="button"
                  variant={emailValidado === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleValidarEmail}
                  disabled={!puedeEditarAcceso || validandoEmail || inputEmail.trim().length < 3}
                  className="shrink-0"
                >
                  {validandoEmail ? "..." : "Validar"}
                </Button>
              </div>
              {emailValidado === false && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Este email ya existe
                </p>
              )}
              {emailValidado === true && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Email disponible
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select value={inputRolId} onValueChange={setInputRolId} disabled={rolSelectDisabled}>
                <SelectTrigger id="rol">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {rolesPermitidos.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {puedeEditarAcceso && (
            <Button onClick={handleActualizarAcceso} disabled={savingAcceso || !puedeActualizarAcceso} className="gap-2">
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
        <CardContent>
          {hotelesDisponibles.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay hoteles disponibles</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSeleccionarTodos}
                  disabled={savingHoteles || hotelesSeleccionadosLocal.size === hotelesDisponibles.length}
                >
                  Seleccionar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeseleccionarTodos}
                  disabled={savingHoteles || hotelesSeleccionadosLocal.size === 0}
                >
                  Deseleccionar todos
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {hotelesDisponibles.map((hotel) => {
                  const hotelIdNum = Number(hotel.value)
                  const seleccionado = hotelesSeleccionadosLocal.has(hotelIdNum)
                  return (
                    <label
                      key={hotel.value}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        savingHoteles ? "cursor-wait opacity-60" : "cursor-pointer"
                      } ${
                        seleccionado
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <Checkbox
                        checked={seleccionado}
                        disabled={savingHoteles}
                        onCheckedChange={() => handleToggleHotelLocal(hotel.value)}
                      />
                      <span className="text-sm font-medium flex-1">{hotel.text}</span>
                      {!hotel.activo && (
                        <span className="text-[10px] uppercase tracking-wide rounded-full border px-2 py-0.5 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                          Inactivo
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
              <div className="mt-4">
                <Button
                  onClick={handleActualizarHoteles}
                  disabled={savingHoteles || !hayCambiosHoteles}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {savingHoteles ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
