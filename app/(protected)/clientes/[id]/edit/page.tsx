"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react"
import {
  obtenerClienteConPipedrive,
  actualizarClienteBasico,
  validarUnicidadClienteCampo,
  type ClienteEditPayload,
} from "@/app/actions/clientes"
import { buscarEmpresasPorNombre, obtenerEmpresa, type EmpresaSugerencia } from "@/app/actions/empresas"
import {
  listaDesplegablePaises,
  listDesplegableEstados,
  listaDesplegableCiudades,
} from "@/app/actions/catalogos"

type DdlItem = { value: string; text: string }

type Form = {
  id: number
  tipo: string
  empresaid: string
  nombre: string
  apellidos: string
  email: string
  telefono: string
  direccion: string
  paisid: string
  estadoid: string
  ciudadid: string
  codigopostal: string
  fuente: string
  puesto: string
  cumpleanos: string // YYYY-MM-DD o ""
  prefEmail: boolean
  prefTelefono: boolean
  notas: string
}

const TIPOS = ["Individual", "Empresa"]
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

type EstadoCampo =
  | { tipo: "idle" }
  | { tipo: "validando" }
  | { tipo: "ok"; mensaje: string }
  | { tipo: "error"; mensaje: string }

function toStr(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v)
}

function parseCumpleanos(v: unknown): { mes: string; dia: string } {
  const s = toStr(v)
  if (!s) return { mes: "", dia: "" }
  // Espera YYYY-MM-DD
  const match = s.match(/^\d{4}-(\d{2})-(\d{2})/)
  if (!match) return { mes: "", dia: "" }
  const mesIdx = Number(match[1]) - 1
  const dia = String(Number(match[2]))
  if (mesIdx < 0 || mesIdx > 11) return { mes: "", dia: "" }
  return { mes: MESES[mesIdx], dia }
}

export default function EditClientePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const idNum = Number(params?.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [form, setForm] = useState<Form | null>(null)

  const [emailInicial, setEmailInicial] = useState("")
  const [telefonoInicial, setTelefonoInicial] = useState("")

  const [estadoEmail, setEstadoEmail] = useState<EstadoCampo>({ tipo: "idle" })
  const [estadoTelefono, setEstadoTelefono] = useState<EstadoCampo>({ tipo: "idle" })

  // Cumpleaños — mes/día separados
  const [cumpleMes, setCumpleMes] = useState("")
  const [cumpleDia, setCumpleDia] = useState("")

  // Empresa autocomplete
  const [empresaInput, setEmpresaInput] = useState("")
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaSugerencia | null>(null)
  const [sugerencias, setSugerencias] = useState<EmpresaSugerencia[]>([])
  const [buscandoEmpresas, setBuscandoEmpresas] = useState(false)

  // Catálogos encadenados
  const [paises, setPaises] = useState<DdlItem[]>([])
  const [estados, setEstados] = useState<DdlItem[]>([])
  const [ciudades, setCiudades] = useState<DdlItem[]>([])

  useEffect(() => {
    async function load() {
      if (!Number.isFinite(idNum) || idNum <= 0) {
        setError("Id inválido"); setLoading(false); return
      }
      const r = await obtenerClienteConPipedrive(idNum)
      if (!r.success || !r.cliente) {
        setError(r.error || "Cliente no encontrado"); setLoading(false); return
      }
      const c = r.cliente as Record<string, unknown>
      const emailVal = toStr(c.email)
      const telVal = toStr(c.telefono)
      const prefs = Array.isArray(c.preferenciasdecontacto) ? (c.preferenciasdecontacto as string[]) : []
      const cumple = parseCumpleanos(c.cumpleanos)

      setForm({
        id: c.id as number,
        tipo: toStr(c.tipo),
        empresaid: toStr(c.empresaid),
        nombre: toStr(c.nombre),
        apellidos: toStr(c.apellidos),
        email: emailVal,
        telefono: telVal,
        direccion: toStr(c.direccion),
        paisid: toStr(c.paisid),
        estadoid: toStr(c.estadoid),
        ciudadid: toStr(c.ciudadid),
        codigopostal: toStr(c.codigopostal),
        fuente: toStr(c.fuente),
        puesto: toStr(c.puesto),
        cumpleanos: toStr(c.cumpleanos),
        prefEmail: prefs.includes("email"),
        prefTelefono: prefs.includes("telefono"),
        notas: toStr(c.notas),
      })
      setEmailInicial(emailVal)
      setTelefonoInicial(telVal)
      setCumpleMes(cumple.mes)
      setCumpleDia(cumple.dia)

      const empresaIdNum = Number(c.empresaid)
      if (Number.isFinite(empresaIdNum) && empresaIdNum > 0) {
        const er = await obtenerEmpresa(empresaIdNum)
        if (er.success && er.data) {
          setEmpresaSeleccionada({ id: er.data.id, nombre: er.data.nombre })
        }
      }
      setLoading(false)
    }
    load()
  }, [idNum])

  useEffect(() => {
    if (!form) return
    if (form.tipo !== "Empresa" || empresaSeleccionada) { setSugerencias([]); return }
    const q = empresaInput.trim()
    if (q.length < 2) { setSugerencias([]); return }
    let cancelado = false
    setBuscandoEmpresas(true)
    const timer = setTimeout(async () => {
      const res = await buscarEmpresasPorNombre(q)
      if (!cancelado) { setSugerencias(res); setBuscandoEmpresas(false) }
    }, 250)
    return () => { cancelado = true; clearTimeout(timer) }
  }, [empresaInput, form, empresaSeleccionada])

  useEffect(() => {
    if (!form) return
    if (form.tipo === "Individual") {
      setEmpresaSeleccionada(null)
      setEmpresaInput("")
      setSugerencias([])
      setForm(prev => prev ? { ...prev, empresaid: "" } : prev)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.tipo])

  useEffect(() => {
    if (!form) return
    const nuevoId = empresaSeleccionada ? String(empresaSeleccionada.id) : ""
    if (form.empresaid !== nuevoId) {
      setForm(prev => prev ? { ...prev, empresaid: nuevoId } : prev)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaSeleccionada])

  useEffect(() => {
    listaDesplegablePaises().then((r) => {
      if (r.success && r.data) setPaises(r.data)
    })
  }, [])

  useEffect(() => {
    if (!form?.paisid) { setEstados([]); return }
    listDesplegableEstados(-1, "", Number(form.paisid)).then((r) => {
      if (r.success && r.data) setEstados(r.data)
    })
  }, [form?.paisid])

  useEffect(() => {
    if (!form?.estadoid) { setCiudades([]); return }
    listaDesplegableCiudades(-1, "", Number(form.estadoid)).then((r) => {
      if (r.success && r.data) setCiudades(r.data)
    })
  }, [form?.estadoid])

  // Sincroniza form.cumpleanos a partir de mes/dia
  useEffect(() => {
    if (!form) return
    let valor = ""
    if (cumpleMes && cumpleDia) {
      const mm = String(MESES.indexOf(cumpleMes) + 1).padStart(2, "0")
      const dd = String(Number(cumpleDia)).padStart(2, "0")
      valor = `2000-${mm}-${dd}`
    }
    if (form.cumpleanos !== valor) {
      setForm(prev => prev ? { ...prev, cumpleanos: valor } : prev)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cumpleMes, cumpleDia])

  function update<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(prev => prev ? { ...prev, [k]: v } : prev)
    setError(null); setOk(null)
    if (k === "email") setEstadoEmail({ tipo: "idle" })
    if (k === "telefono") setEstadoTelefono({ tipo: "idle" })
  }

  function toIntOrNull(v: string): number | null {
    const s = v.trim()
    if (!s) return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }

  async function validarCampo(campo: "email" | "telefono") {
    if (!form) return
    const valor = campo === "email" ? form.email : form.telefono
    const setEstado = campo === "email" ? setEstadoEmail : setEstadoTelefono
    if (!valor.trim()) {
      setEstado({ tipo: "error", mensaje: "El campo está vacío." })
      return
    }
    setEstado({ tipo: "validando" })
    const r = await validarUnicidadClienteCampo(form.id, campo, valor)
    setEstado(r.disponible ? { tipo: "ok", mensaje: r.mensaje } : { tipo: "error", mensaje: r.mensaje })
  }

  async function onGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setError(null); setOk(null)

    if (form.nombre.trim().length <= 3) { setError("El nombre debe tener más de 3 caracteres."); return }
    if (!form.email.trim() && !form.telefono.trim()) {
      setError("Debe proporcionar al menos un email o un teléfono."); return
    }

    const payload: ClienteEditPayload = {
      tipo: form.tipo || null,
      empresaid: toIntOrNull(form.empresaid),
      nombre: form.nombre,
      apellidos: form.apellidos,
      email: form.email,
      telefono: form.telefono,
      direccion: form.direccion,
      paisid: toIntOrNull(form.paisid),
      estadoid: toIntOrNull(form.estadoid),
      ciudadid: toIntOrNull(form.ciudadid),
      codigopostal: form.codigopostal,
      fuente: form.fuente || null,
      puesto: form.puesto,
      cumpleanos: form.cumpleanos || null,
      preferenciaEmail: form.prefEmail,
      preferenciaTelefono: form.prefTelefono,
      notas: form.notas,
    }

    setSaving(true)
    const r = await actualizarClienteBasico(form.id, payload)
    setSaving(false)
    if (r.success) {
      setOk("Cliente actualizado.")
      setEmailInicial(form.email)
      setTelefonoInicial(form.telefono)
      setEstadoEmail({ tipo: "idle" })
      setEstadoTelefono({ tipo: "idle" })
    } else {
      setError(r.error || "Error desconocido")
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-10 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="mx-auto max-w-3xl py-10 space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      </div>
    )
  }

  if (!form) return null

  const emailCambio = form.email !== emailInicial
  const telefonoCambio = form.telefono !== telefonoInicial
  const emailOk = !emailCambio || estadoEmail.tipo === "ok"
  const telefonoOk = !telefonoCambio || estadoTelefono.tipo === "ok"
  const nombreOk = form.nombre.trim().length > 3
  const apellidosOk = form.apellidos.trim().length > 0
  const alMenosUno = form.email.trim() !== "" || form.telefono.trim() !== ""
  const puedeGuardar = !saving && nombreOk && apellidosOk && alMenosUno && emailOk && telefonoOk

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar cliente #{form.id}</h1>
          <p className="text-sm text-muted-foreground">Solo se actualizan los campos del formulario.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onGuardar} className="space-y-4">
            {/* Fila 1: Nombre | Apellidos */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nombre <span className="text-red-500">*</span></Label>
                <Input value={form.nombre} onChange={(e) => update("nombre", e.target.value)} />
                {!nombreOk && form.nombre.length > 0 && (
                  <p className="text-xs text-red-600">Debe tener más de 3 caracteres.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Apellidos <span className="text-red-500">*</span></Label>
                <Input value={form.apellidos} onChange={(e) => update("apellidos", e.target.value)} />
              </div>
            </div>

            {/* Fila 2: Tipo | Empresa */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => update("tipo", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                {empresaSeleccionada ? (
                  <div className="flex h-9 items-center">
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-sm text-blue-900">
                      {empresaSeleccionada.nombre}
                      <button
                        type="button"
                        onClick={() => { setEmpresaSeleccionada(null); setEmpresaInput("") }}
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
                      value={empresaInput}
                      onChange={(e) => setEmpresaInput(e.target.value)}
                      placeholder={form.tipo === "Empresa" ? "Escribe el nombre de la empresa" : "Selecciona Tipo = Empresa para habilitar"}
                      disabled={form.tipo !== "Empresa"}
                      autoComplete="off"
                    />
                    {form.tipo === "Empresa" && empresaInput.trim().length >= 2 && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-md">
                        {buscandoEmpresas && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Buscando…</div>
                        )}
                        {!buscandoEmpresas && sugerencias.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Sin coincidencias</div>
                        )}
                        {!buscandoEmpresas && sugerencias.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => { setEmpresaSeleccionada(s); setSugerencias([]) }}
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

            {/* Fila 3: Cumpleaños | Puesto */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Cumpleaños</Label>
                <div className="flex gap-2">
                  <Select
                    value={cumpleMes}
                    onValueChange={(v) => {
                      setCumpleMes(v)
                      if (cumpleDia && Number(cumpleDia) > diasDelMes(v)) setCumpleDia("")
                    }}
                  >
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Mes" /></SelectTrigger>
                    <SelectContent>
                      {MESES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={cumpleDia} onValueChange={setCumpleDia} disabled={!cumpleMes}>
                    <SelectTrigger className="w-24"><SelectValue placeholder="Día" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: diasDelMes(cumpleMes) }, (_, i) => String(i + 1)).map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Puesto</Label>
                <Input value={form.puesto} onChange={(e) => update("puesto", e.target.value)} placeholder="Director, Gerente, etc." />
              </div>
            </div>

            {/* Fila 4: Email | Teléfono (con botón Validar) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <div className="flex gap-2">
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => validarCampo("email")} disabled={estadoEmail.tipo === "validando" || !form.email.trim()}>
                    {estadoEmail.tipo === "validando" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar"}
                  </Button>
                </div>
                {estadoEmail.tipo === "ok" && (
                  <p className="flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="h-3 w-3" /> {estadoEmail.mensaje}</p>
                )}
                {estadoEmail.tipo === "error" && (
                  <p className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3 w-3" /> {estadoEmail.mensaje}</p>
                )}
                {emailCambio && estadoEmail.tipo === "idle" && (
                  <p className="text-xs text-amber-600">Cambió — valida para habilitar Guardar.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <div className="flex gap-2">
                  <Input value={form.telefono} maxLength={20} onChange={(e) => update("telefono", e.target.value)} className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => validarCampo("telefono")} disabled={estadoTelefono.tipo === "validando" || !form.telefono.trim()}>
                    {estadoTelefono.tipo === "validando" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar"}
                  </Button>
                </div>
                {estadoTelefono.tipo === "ok" && (
                  <p className="flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="h-3 w-3" /> {estadoTelefono.mensaje}</p>
                )}
                {estadoTelefono.tipo === "error" && (
                  <p className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3 w-3" /> {estadoTelefono.mensaje}</p>
                )}
                {telefonoCambio && estadoTelefono.tipo === "idle" && (
                  <p className="text-xs text-amber-600">Cambió — valida para habilitar Guardar.</p>
                )}
              </div>
            </div>

            {/* Divider Dirección */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-start">
                <span className="bg-background pr-2 text-sm font-medium text-muted-foreground">Dirección</span>
              </div>
            </div>

            {/* Fila: Pais | Estado */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Pais</Label>
                <Select
                  value={form.paisid}
                  onValueChange={(v) => {
                    setForm(prev => prev ? { ...prev, paisid: v, estadoid: "", ciudadid: "" } : prev)
                    setEstados([]); setCiudades([])
                    setError(null); setOk(null)
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona un país" /></SelectTrigger>
                  <SelectContent>
                    {paises.map(p => <SelectItem key={p.value} value={p.value}>{p.text}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={form.estadoid}
                  onValueChange={(v) => {
                    setForm(prev => prev ? { ...prev, estadoid: v, ciudadid: "" } : prev)
                    setCiudades([])
                    setError(null); setOk(null)
                  }}
                  disabled={!form.paisid}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.paisid ? "Selecciona un estado" : "Selecciona un país primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map(e => <SelectItem key={e.value} value={e.value}>{e.text}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fila: Ciudad | Código Postal */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Select value={form.ciudadid} onValueChange={(v) => update("ciudadid", v)} disabled={!form.estadoid}>
                  <SelectTrigger>
                    <SelectValue placeholder={form.estadoid ? "Selecciona una ciudad" : "Selecciona un estado primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ciudades.map(c => <SelectItem key={c.value} value={c.value}>{c.text}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Código Postal</Label>
                <Input value={form.codigopostal} onChange={(e) => update("codigopostal", e.target.value)} />
              </div>
            </div>

            {/* Fila: Dirección (full) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Dirección</Label>
                <Input value={form.direccion} onChange={(e) => update("direccion", e.target.value)} />
              </div>
            </div>

            {/* Divider Preferencias */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-start">
                <span className="bg-background pr-2 text-sm font-medium text-muted-foreground">Preferencias</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.prefEmail} onCheckedChange={(v) => update("prefEmail", Boolean(v))} />
                Por Email
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.prefTelefono} onCheckedChange={(v) => update("prefTelefono", Boolean(v))} />
                Por Teléfono
              </label>
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea
                value={form.notas}
                onChange={(e) => update("notas", e.target.value.slice(0, 1000))}
                maxLength={1000}
                rows={4}
                placeholder="Notas adicionales sobre el cliente"
              />
              <div className="text-right text-xs text-muted-foreground">{form.notas.length}/1000</div>
            </div>

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-700 px-4 py-2 text-sm">
                {error}
              </div>
            )}
            {ok && (
              <div className="rounded-md border border-green-500/40 bg-green-500/10 text-green-700 px-4 py-2 text-sm">
                {ok}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/clientes/ver/${form.id}`)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!puedeGuardar}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
