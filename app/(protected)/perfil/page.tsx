"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, KeyRound, Lock, Save, Hotel, User, CheckCircle2, XCircle } from "lucide-react"
import {
  obtenerUsuarioDetalle,
  actualizarInfoBasicaUsuario,
  actualizarAccesoUsuario,
  actualizarPasswordUsuario,
  obtenerUsuariosXHotel,
  validarUsuarioUnico,
  verificarPasswordActual,
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
  hotelActivo: boolean
}

export default function PerfilPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<number>(0)
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null)
  const [roles, setRoles] = useState<Rol[]>([])
  const [sesionRolId, setSesionRolId] = useState<number>(0)

  // Info básica form
  const [inputNombre, setInputNombre] = useState("")
  const [inputPuesto, setInputPuesto] = useState("")
  const [inputTelefono, setInputTelefono] = useState("")
  const [inputCelular, setInputCelular] = useState("")
  const [inputHotelNombre, setInputHotelNombre] = useState("")
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
  const [passwordActual, setPasswordActual] = useState("")
  const [passwordActualValidada, setPasswordActualValidada] = useState<null | boolean>(null)
  const [validandoPasswordActual, setValidandoPasswordActual] = useState(false)
  const [password1, setPassword1] = useState("")
  const [password2, setPassword2] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  // Hoteles (solo lectura)
  const [hotelesUsuario, setHotelesUsuario] = useState<UsuarioXHotel[]>([])

  useEffect(() => {
    async function loadData() {
      const sesion = await obtenerSesion()
      if (!sesion || !sesion.UsuarioId) {
        router.push("/login")
        return
      }

      const sesionUserId = Number(sesion.UsuarioId)
      if (!sesionUserId || isNaN(sesionUserId)) {
        router.push("/login")
        return
      }

      setId(sesionUserId)
      setSesionRolId(Number(sesion.RolId) || 0)

      // Nombre del hotel principal desde la cookie HotelId
      const hotelIdCookie = Number(sesion.HotelId)
      if (hotelIdCookie > 0) {
        const resHotel = await listaDesplegableHoteles(hotelIdCookie, "", true)
        if (resHotel.success && resHotel.data && resHotel.data.length > 0) {
          setInputHotelNombre(resHotel.data[0].text)
        } else {
          setInputHotelNombre("Sin Asignación")
        }
      } else {
        setInputHotelNombre("Sin Asignación")
      }

      const [resultUsuario, resultRoles, resultHoteles] = await Promise.all([
        obtenerUsuarioDetalle(sesionUserId),
        obtenerRoles(),
        obtenerUsuariosXHotel(sesionUserId),
      ])

      if (resultUsuario.success && resultUsuario.data) {
        setUsuario(resultUsuario.data)
        setInputNombre(resultUsuario.data.nombrecompleto || "")
        setInputPuesto(resultUsuario.data.puesto || "")
        setInputTelefono(resultUsuario.data.telefono || "")
        setInputCelular(resultUsuario.data.celular || "")
        setInputUsuario(resultUsuario.data.usuario || "")
        setInputEmail(resultUsuario.data.email || "")
        setInputRolId(resultUsuario.data.rolid?.toString() || "")

        // Auto-validar valores cargados (excluyendo al propio usuario)
        if (resultUsuario.data.usuario) {
          const r = await validarUsuarioUnico("usuario", resultUsuario.data.usuario, sesionUserId)
          if (r.success) setUsuarioValidado(!r.existe)
        }
        if (resultUsuario.data.email) {
          const r = await validarUsuarioUnico("email", resultUsuario.data.email, sesionUserId)
          if (r.success) setEmailValidado(!r.existe)
        }
      } else {
        toast.error(resultUsuario.error || "Error al cargar el perfil")
      }

      if (resultRoles.success && resultRoles.data) {
        setRoles(resultRoles.data)
      }

      if (resultHoteles.success && resultHoteles.data) {
        setHotelesUsuario(resultHoteles.data)
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  // Reset validación cuando cambia el input
  useEffect(() => { setUsuarioValidado(null) }, [inputUsuario])
  useEffect(() => { setEmailValidado(null) }, [inputEmail])
  useEffect(() => { setPasswordActualValidada(null) }, [passwordActual])

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

  async function handleValidarPasswordActual() {
    if (!passwordActual) {
      toast.error("Ingresa tu contraseña actual")
      return
    }
    setValidandoPasswordActual(true)
    const result = await verificarPasswordActual(id, passwordActual)
    if (result.success) {
      setPasswordActualValidada(result.coincide)
    } else {
      toast.error(result.error)
    }
    setValidandoPasswordActual(false)
  }

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
    if (passwordActualValidada !== true) {
      toast.error("Debes validar tu contraseña actual")
      return
    }

    setSavingPassword(true)
    const result = await actualizarPasswordUsuario(id, password1)

    if (result.success) {
      toast.success("Contraseña actualizada correctamente")
      setPassword1("")
      setPassword2("")
      setPasswordActual("")
      setPasswordActualValidada(null)
    } else {
      toast.error(result.error)
    }
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!usuario) return null

  // Permisos por rol (en perfil propio el usuario puede cambiar su password siempre)
  const esRolAdmin = sesionRolId === 1 || sesionRolId === 2
  const puedeEditarAcceso = esRolAdmin
  const puedeEditarPassword = true

  // Habilitado solo si ambas validaciones están en "disponible" (o el input quedó vacío)
  const usuarioOk = inputUsuario.trim().length === 0 || usuarioValidado === true
  const emailOk = inputEmail.trim().length === 0 || emailValidado === true
  const puedeActualizarAcceso = puedeEditarAcceso && usuarioOk && emailOk

  const passwordsCoinciden = password1 === password2
  const passwordIngresada = password1.trim().length > 0 && password2.trim().length > 0
  const puedeActualizarPassword =
    puedeEditarPassword &&
    passwordActualValidada === true &&
    passwordIngresada &&
    passwordsCoinciden

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground mt-1">{usuario.nombrecompleto}</p>
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
              <Input
                id="hotelPrincipal"
                type="text"
                value={inputHotelNombre}
                disabled
                readOnly
              />
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
              <Select value={inputRolId} onValueChange={setInputRolId} disabled>
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
          {/* Contraseña actual */}
          <div className="space-y-2 max-w-md">
            <Label htmlFor="passwordActual">Introduce tu contraseña actual</Label>
            <div className="flex gap-2">
              <Input
                id="passwordActual"
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Contraseña actual"
                className={passwordActualValidada === false ? "border-red-500" : passwordActualValidada === true ? "border-emerald-500" : ""}
              />
              <Button
                type="button"
                variant={passwordActualValidada === false ? "destructive" : "outline"}
                size="sm"
                onClick={handleValidarPasswordActual}
                disabled={validandoPasswordActual || passwordActual.length === 0}
                className="shrink-0"
              >
                {validandoPasswordActual ? "..." : "Validar"}
              </Button>
            </div>
            {passwordActualValidada === false && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> La contraseña no coincide
              </p>
            )}
            {passwordActualValidada === true && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Contraseña correcta
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password1">Nueva contraseña</Label>
              <Input
                id="password1"
                type="password"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                placeholder="Ingresa la nueva contraseña"
                disabled={passwordActualValidada !== true}
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
                disabled={passwordActualValidada !== true}
                className={password2.length > 0 ? (passwordsCoinciden ? "border-emerald-500" : "border-red-500") : ""}
              />
              {password2.length > 0 && (
                passwordsCoinciden ? (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Las contraseñas coinciden
                  </p>
                ) : (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Las contraseñas no coinciden
                  </p>
                )
              )}
            </div>
          </div>
          <Button
            onClick={handleActualizarPassword}
            disabled={savingPassword || !puedeActualizarPassword}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            {savingPassword ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </CardContent>
      </Card>

      {/* Bloque: Hoteles (solo lectura) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="h-5 w-5 text-primary" />
            Hoteles con Acceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Acrónimo</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotelesUsuario.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No tienes hoteles asignados
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
                            h.hotelActivo
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                          }`}
                        >
                          {h.hotelActivo ? "Activo" : "Inactivo"}
                        </span>
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
