"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, KeyRound, Lock, Save, Hotel, User, CheckCircle2, XCircle } from "lucide-react"
import { crearUsuario, validarUsuarioUnico, agregarUsuarioXHotel } from "@/app/actions/usuarios"
import { obtenerRoles } from "@/app/actions/configuraciones"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { toast } from "sonner"

interface Rol {
  id: number
  nombre: string
}

interface HotelItem {
  value: string
  text: string
}

export default function CrearUsuarioPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Rol[]>([])
  const [hoteles, setHoteles] = useState<HotelItem[]>([])
  const [saving, setSaving] = useState(false)

  // Info básica
  const [inputNombre, setInputNombre] = useState("")
  const [inputPuesto, setInputPuesto] = useState("")
  const [inputTelefono, setInputTelefono] = useState("")
  const [inputCelular, setInputCelular] = useState("")

  // Acceso
  const [inputUsuario, setInputUsuario] = useState("")
  const [inputEmail, setInputEmail] = useState("")
  const [inputRolId, setInputRolId] = useState("")

  // Validaciones usuario/email
  const [usuarioValidado, setUsuarioValidado] = useState<null | boolean>(null) // null=sin validar, true=ok, false=duplicado
  const [emailValidado, setEmailValidado] = useState<null | boolean>(null)
  const [validandoUsuario, setValidandoUsuario] = useState(false)
  const [validandoEmail, setValidandoEmail] = useState(false)

  // Contraseña
  const [password1, setPassword1] = useState("")
  const [password2, setPassword2] = useState("")

  // Hoteles seleccionados
  const [hotelesSeleccionados, setHotelesSeleccionados] = useState<string[]>([])

  useEffect(() => {
    async function loadData() {
      const [resultRoles, resultHoteles] = await Promise.all([
        obtenerRoles(),
        listaDesplegableHoteles(-1, "", true),
      ])

      if (resultRoles.success && resultRoles.data) {
        setRoles(resultRoles.data)
      }
      if (resultHoteles.success && resultHoteles.data) {
        setHoteles(resultHoteles.data)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Reset validación cuando cambia el input
  useEffect(() => { setUsuarioValidado(null) }, [inputUsuario])
  useEffect(() => { setEmailValidado(null) }, [inputEmail])

  async function handleValidarUsuario() {
    if (inputUsuario.trim().length < 3) {
      toast.error("El usuario debe tener al menos 3 caracteres")
      return
    }
    setValidandoUsuario(true)
    const result = await validarUsuarioUnico("usuario", inputUsuario.trim())
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
    const result = await validarUsuarioUnico("email", inputEmail.trim())
    if (result.success) {
      setEmailValidado(!result.existe)
    } else {
      toast.error(result.error)
    }
    setValidandoEmail(false)
  }

  function handleToggleHotel(hotelId: string) {
    setHotelesSeleccionados((prev) =>
      prev.includes(hotelId) ? prev.filter((id) => id !== hotelId) : [...prev, hotelId]
    )
  }

  // Validaciones para el botón Crear
  const passwordsCoinciden = password1 === password2
  const passwordIngresada = password1.trim().length > 0 && password2.trim().length > 0
  const tieneUsuarioOEmail = inputUsuario.trim().length >= 3 || inputEmail.trim().length >= 3
  const usuarioDuplicado = usuarioValidado === false
  const emailDuplicado = emailValidado === false
  const usuarioNecesitaValidar = inputUsuario.trim().length >= 3 && usuarioValidado === null
  const emailNecesitaValidar = inputEmail.trim().length >= 3 && emailValidado === null

  const puedeCrear =
    inputNombre.trim().length > 0 &&
    !!inputRolId &&
    tieneUsuarioOEmail &&
    !usuarioDuplicado &&
    !emailDuplicado &&
    !usuarioNecesitaValidar &&
    !emailNecesitaValidar &&
    passwordIngresada &&
    passwordsCoinciden

  async function handleCrear() {
    if (!inputNombre.trim()) {
      toast.error("El nombre completo es requerido")
      return
    }
    if (!inputRolId) {
      toast.error("El rol es requerido")
      return
    }
    if (!tieneUsuarioOEmail) {
      toast.error("Al menos Usuario o Email debe tener un dato válido (mínimo 3 caracteres)")
      return
    }
    if (usuarioNecesitaValidar || emailNecesitaValidar) {
      toast.error("Debes validar el usuario y/o email antes de crear")
      return
    }
    if (usuarioDuplicado || emailDuplicado) {
      toast.error("Hay campos duplicados, verifica usuario y email")
      return
    }
    if (!passwordIngresada) {
      toast.error("La contraseña es requerida")
      return
    }
    if (!passwordsCoinciden) {
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
      const nuevoUsuarioId = result.data

      // Insertar relaciones usuario x hotel
      if (hotelesSeleccionados.length > 0) {
        const promesas = hotelesSeleccionados.map((hotelId) =>
          agregarUsuarioXHotel(nuevoUsuarioId, Number(hotelId))
        )
        await Promise.all(promesas)
      }

      toast.success("Usuario creado correctamente")
      router.push(`/admin/usuarios/ver?id=${nuevoUsuarioId}`)
    } else {
      toast.error(result.error || "Error al crear usuario")
    }

    setSaving(false)
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
            {/* Usuario con validar */}
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <div className="flex gap-2">
                <Input
                  id="usuario"
                  value={inputUsuario}
                  onChange={(e) => setInputUsuario(e.target.value)}
                  placeholder="Nombre de usuario"
                  className={usuarioValidado === false ? "border-red-500" : usuarioValidado === true ? "border-emerald-500" : ""}
                />
                <Button
                  type="button"
                  variant={usuarioValidado === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleValidarUsuario}
                  disabled={validandoUsuario || inputUsuario.trim().length < 3}
                  className="shrink-0"
                >
                  {validandoUsuario ? "..." : "Validar"}
                </Button>
              </div>
              {usuarioValidado === false && (
                <p className="text-xs text-red-500">Este usuario ya existe en el sistema</p>
              )}
              {usuarioValidado === true && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Usuario disponible
                </p>
              )}
            </div>

            {/* Email con validar */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className={emailValidado === false ? "border-red-500" : emailValidado === true ? "border-emerald-500" : ""}
                />
                <Button
                  type="button"
                  variant={emailValidado === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleValidarEmail}
                  disabled={validandoEmail || inputEmail.trim().length < 3}
                  className="shrink-0"
                >
                  {validandoEmail ? "..." : "Validar"}
                </Button>
              </div>
              {emailValidado === false && (
                <p className="text-xs text-red-500">Este email ya existe en el sistema</p>
              )}
              {emailValidado === true && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Email disponible
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              <Select value={inputRolId} onValueChange={setInputRolId}>
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
        </CardContent>
      </Card>

      {/* Bloque: Hoteles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hotel className="h-5 w-5 text-primary" />
            Hoteles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hoteles.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay hoteles disponibles</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHotelesSeleccionados(hoteles.map((h) => h.value))}
                  disabled={hotelesSeleccionados.length === hoteles.length}
                >
                  Seleccionar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHotelesSeleccionados([])}
                  disabled={hotelesSeleccionados.length === 0}
                >
                  Deseleccionar todos
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hoteles.map((hotel) => (
                <label
                  key={hotel.value}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    hotelesSeleccionados.includes(hotel.value)
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <Checkbox
                    checked={hotelesSeleccionados.includes(hotel.value)}
                    onCheckedChange={() => handleToggleHotel(hotel.value)}
                  />
                  <span className="text-sm font-medium">{hotel.text}</span>
                </label>
              ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Botón Crear */}
      <div className="flex justify-end">
        <Button onClick={handleCrear} disabled={saving || !puedeCrear} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Creando..." : "Crear Usuario"}
        </Button>
      </div>
    </div>
  )
}
