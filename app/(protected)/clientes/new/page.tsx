"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle2, ArrowLeft, X } from "lucide-react"
import { validarClienteEnPipedrive, type MatchPipedrive } from "@/app/actions/pipedrive"
import { buscarEmpresasPorNombre, type EmpresaSugerencia } from "@/app/actions/empresas"
import { crearClienteNuevo } from "@/app/actions/clientes"
import {
  listaDesplegablePaises,
  listDesplegableEstados,
  listaDesplegableCiudades,
} from "@/app/actions/catalogos"

type DdlItem = { value: string; text: string }

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function diasDelMes(mes: string): number {
  const idx = MESES.indexOf(mes)
  if (idx === -1) return 31
  if (idx === 1) return 29
  return [3, 5, 8, 10].includes(idx) ? 30 : 31
}

type EstadoValidacion =
  | { tipo: "idle" }
  | { tipo: "validando" }
  | { tipo: "disponible"; mensaje: string }
  | { tipo: "existe"; mensaje: string; matches: MatchPipedrive[] }
  | { tipo: "error"; mensaje: string }

export default function NuevoClientePage() {
  const router = useRouter()
  const [registrando, setRegistrando] = useState(false)
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [estado, setEstado] = useState<EstadoValidacion>({ tipo: "idle" })
  const [nombre, setNombre] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [tipo, setTipo] = useState<"Individual" | "Empresa">("Individual")
  const [empresaInput, setEmpresaInput] = useState("")
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaSugerencia | null>(null)
  const [sugerencias, setSugerencias] = useState<EmpresaSugerencia[]>([])
  const [buscandoEmpresas, setBuscandoEmpresas] = useState(false)

  useEffect(() => {
    if (tipo !== "Empresa" || empresaSeleccionada) {
      setSugerencias([])
      return
    }
    const q = empresaInput.trim()
    if (q.length < 2) {
      setSugerencias([])
      return
    }
    let cancelado = false
    setBuscandoEmpresas(true)
    const timer = setTimeout(async () => {
      const res = await buscarEmpresasPorNombre(q)
      if (!cancelado) {
        setSugerencias(res)
        setBuscandoEmpresas(false)
      }
    }, 250)
    return () => {
      cancelado = true
      clearTimeout(timer)
    }
  }, [empresaInput, tipo, empresaSeleccionada])

  useEffect(() => {
    if (tipo === "Individual") {
      setEmpresaInput("")
      setEmpresaSeleccionada(null)
      setSugerencias([])
    }
  }, [tipo])

  const [paisId, setPaisId] = useState("")
  const [estadoId, setEstadoId] = useState("")
  const [ciudadId, setCiudadId] = useState("")
  const [codigoPostal, setCodigoPostal] = useState("")
  const [direccion, setDireccion] = useState("")
  const [cumpleMes, setCumpleMes] = useState("")
  const [cumpleDia, setCumpleDia] = useState("")
  const [puesto, setPuesto] = useState("")
  const [prefEmail, setPrefEmail] = useState(false)
  const [prefTelefono, setPrefTelefono] = useState(false)
  const [notas, setNotas] = useState("")
  const [paises, setPaises] = useState<DdlItem[]>([])
  const [estados, setEstados] = useState<DdlItem[]>([])
  const [ciudades, setCiudades] = useState<DdlItem[]>([])

  useEffect(() => {
    listaDesplegablePaises().then((r) => {
      if (r.success && r.data) setPaises(r.data)
    })
  }, [])

  useEffect(() => {
    setEstadoId("")
    setCiudadId("")
    setEstados([])
    setCiudades([])
    if (!paisId) return
    listDesplegableEstados(-1, "", Number(paisId)).then((r) => {
      if (r.success && r.data) setEstados(r.data)
    })
  }, [paisId])

  useEffect(() => {
    setCiudadId("")
    setCiudades([])
    if (!estadoId) return
    listaDesplegableCiudades(-1, "", Number(estadoId)).then((r) => {
      if (r.success && r.data) setCiudades(r.data)
    })
  }, [estadoId])

  const handleValidar = async () => {
    if (!email.trim() && !telefono.trim()) {
      setEstado({ tipo: "error", mensaje: "Debes ingresar un email o un teléfono para validar." })
      return
    }
    setEstado({ tipo: "validando" })
    const res = await validarClienteEnPipedrive(email, telefono)
    if (!res.success) {
      setEstado({ tipo: "error", mensaje: res.mensaje })
      return
    }
    if (res.disponible) {
      setEstado({ tipo: "disponible", mensaje: res.mensaje })
    } else {
      setEstado({ tipo: "existe", mensaje: res.mensaje, matches: res.matches })
    }
  }

  const handleReset = () => {
    setEstado({ tipo: "idle" })
  }

  const validando = estado.tipo === "validando"

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nuevo Cliente</h1>
          <p className="text-sm text-muted-foreground">Registra un nuevo cliente en el sistema</p>
        </div>
        <Link href="/clientes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Paso 1: Validación en Pipedrive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            Antes de registrar un nuevo cliente, se validará que el <strong>correo electrónico</strong> y/o el{" "}
            <strong>teléfono</strong> no existan previamente en Pipedrive. Si ya existen, significa que el cliente ya
            está creado en Pipedrive y debes ejecutar el proceso{" "}
            <strong>&quot;Actualizar con Pipedrive&quot;</strong> en la pantalla de{" "}
            <Link href="/clientes" className="underline">
              /clientes
            </Link>{" "}
            para sincronizarlo al sistema.
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (estado.tipo !== "idle" && estado.tipo !== "validando") handleReset()
                }}
                disabled={validando}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+52 443 123 4567"
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value)
                  if (estado.tipo !== "idle" && estado.tipo !== "validando") handleReset()
                }}
                disabled={validando}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleValidar} disabled={validando}>
              {validando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando…
                </>
              ) : (
                "Validar"
              )}
            </Button>
          </div>

          {estado.tipo === "error" && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{estado.mensaje}</div>
            </div>
          )}

          {estado.tipo === "disponible" && (
            <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{estado.mensaje}</div>
            </div>
          )}

          {estado.tipo === "existe" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">{estado.mensaje}</div>
                  <div className="mt-1">
                    No se puede continuar con el alta. Ve a{" "}
                    <Link href="/clientes" className="underline font-medium">
                      /clientes
                    </Link>{" "}
                    y ejecuta <strong>&quot;Actualizar con Pipedrive&quot;</strong>.
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Fuente</th>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Emails</th>
                      <th className="px-3 py-2 text-left">Teléfonos</th>
                      <th className="px-3 py-2 text-left">Coincidencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estado.matches.map((m) => (
                      <tr key={`${m.fuente}-${m.id}`} className="border-t">
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs ${m.fuente === "pipedrive" ? "bg-blue-100 text-blue-900" : "bg-purple-100 text-purple-900"}`}>
                            {m.fuente === "pipedrive" ? "Pipedrive" : "Clientes"}
                          </span>
                        </td>
                        <td className="px-3 py-2">{m.id}</td>
                        <td className="px-3 py-2">{m.nombre}</td>
                        <td className="px-3 py-2">{m.emails.join(", ")}</td>
                        <td className="px-3 py-2">{m.telefonos.join(", ")}</td>
                        <td className="px-3 py-2 capitalize">{m.origen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {estado.tipo === "disponible" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos del cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos <span className="text-red-500">*</span></Label>
                <Input
                  id="apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Pérez López"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo <span className="text-red-500">*</span></Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as "Individual" | "Empresa")}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Empresa">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                {empresaSeleccionada ? (
                  <div className="flex h-9 items-center">
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-sm text-blue-900">
                      {empresaSeleccionada.nombre}
                      <button
                        type="button"
                        onClick={() => {
                          setEmpresaSeleccionada(null)
                          setEmpresaInput("")
                        }}
                        className="ml-1 rounded-full p-0.5 hover:bg-blue-200"
                        aria-label="Quitar empresa"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="empresa"
                      value={empresaInput}
                      onChange={(e) => setEmpresaInput(e.target.value)}
                      placeholder="Escribe el nombre de la empresa"
                      disabled={tipo !== "Empresa"}
                      autoComplete="off"
                    />
                    {tipo === "Empresa" && empresaInput.trim().length >= 2 && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-md">
                        {buscandoEmpresas && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Buscando…</div>
                        )}
                        {!buscandoEmpresas && sugerencias.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Sin coincidencias</div>
                        )}
                        {!buscandoEmpresas &&
                          sugerencias.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setEmpresaSeleccionada(s)
                                setSugerencias([])
                              }}
                              className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                              {s.nombre}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cumpleaños</Label>
                <div className="flex gap-2">
                  <Select value={cumpleMes} onValueChange={(v) => { setCumpleMes(v); if (cumpleDia && Number(cumpleDia) > diasDelMes(v)) setCumpleDia("") }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={cumpleDia} onValueChange={setCumpleDia} disabled={!cumpleMes}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: diasDelMes(cumpleMes) }, (_, i) => String(i + 1)).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="puesto">Puesto</Label>
                <Input
                  id="puesto"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  placeholder="Director, Gerente, etc."
                />
              </div>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-start">
                <span className="bg-background pr-2 text-sm font-medium text-muted-foreground">Dirección</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Select value={paisId} onValueChange={setPaisId}>
                  <SelectTrigger id="pais">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {paises.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={estadoId} onValueChange={setEstadoId} disabled={!paisId}>
                  <SelectTrigger id="estado">
                    <SelectValue placeholder={paisId ? "Selecciona un estado" : "Selecciona un país primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Select value={ciudadId} onValueChange={setCiudadId} disabled={!estadoId}>
                  <SelectTrigger id="ciudad">
                    <SelectValue placeholder={estadoId ? "Selecciona una ciudad" : "Selecciona un estado primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ciudades.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp">Código postal</Label>
                <Input
                  id="cp"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  placeholder="58000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número, colonia"
                />
              </div>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-start">
                <span className="bg-background pr-2 text-sm font-medium text-muted-foreground">Preferencias</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={prefEmail}
                  onCheckedChange={(v) => setPrefEmail(Boolean(v))}
                />
                Por Email
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={prefTelefono}
                  onCheckedChange={(v) => setPrefTelefono(Boolean(v))}
                />
                Por Teléfono
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value.slice(0, 1000))}
                maxLength={1000}
                rows={4}
                placeholder="Notas adicionales sobre el cliente"
              />
              <div className="text-right text-xs text-muted-foreground">{notas.length}/1000</div>
            </div>

            {errorRegistro && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{errorRegistro}</div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                disabled={!nombre.trim() || !apellidos.trim() || !tipo || registrando}
                onClick={async () => {
                  setErrorRegistro(null)
                  if (!nombre.trim() || !apellidos.trim() || !tipo) {
                    setErrorRegistro("Nombre, Apellidos y Tipo son obligatorios.")
                    return
                  }
                  setRegistrando(true)
                  const cumpleanos =
                    cumpleMes && cumpleDia
                      ? `2000-${String(MESES.indexOf(cumpleMes) + 1).padStart(2, "0")}-${String(cumpleDia).padStart(2, "0")}`
                      : null
                  const res = await crearClienteNuevo({
                    nombre,
                    apellidos,
                    tipo,
                    empresaid: empresaSeleccionada?.id ?? null,
                    email,
                    telefono,
                    puesto,
                    cumpleanos,
                    paisid: paisId ? Number(paisId) : null,
                    estadoid: estadoId ? Number(estadoId) : null,
                    ciudadid: ciudadId ? Number(ciudadId) : null,
                    codigopostal: codigoPostal,
                    direccion,
                    preferenciaEmail: prefEmail,
                    preferenciaTelefono: prefTelefono,
                    notas,
                  })
                  if (!res.success) {
                    setErrorRegistro(res.error || "Error registrando el cliente.")
                    setRegistrando(false)
                    return
                  }
                  router.push(`/clientes/ver/${res.id}`)
                }}
              >
                {registrando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando…
                  </>
                ) : (
                  "Registrar"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
