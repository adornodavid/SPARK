"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { obtenerClienteConPipedrive, actualizarClienteBasico, type ClienteEditPayload } from "@/app/actions/clientes"

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
}

const FUENTES = ["MeethingHub", "Pipedrive", "SPARK"]
const TIPOS = ["Individual", "Empresa"]

function toStr(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v)
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
      setForm({
        id: c.id as number,
        tipo: toStr(c.tipo),
        empresaid: toStr(c.empresaid),
        nombre: toStr(c.nombre),
        apellidos: toStr(c.apellidos),
        email: toStr(c.email),
        telefono: toStr(c.telefono),
        direccion: toStr(c.direccion),
        paisid: toStr(c.paisid),
        estadoid: toStr(c.estadoid),
        ciudadid: toStr(c.ciudadid),
        codigopostal: toStr(c.codigopostal),
        fuente: toStr(c.fuente),
      })
      setLoading(false)
    }
    load()
  }, [idNum])

  function update<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(prev => prev ? { ...prev, [k]: v } : prev)
    setError(null); setOk(null)
  }

  function toIntOrNull(v: string): number | null {
    const s = v.trim()
    if (!s) return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }

  async function onGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setError(null); setOk(null)

    // Validación cliente-side rápida
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return }
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
    }

    setSaving(true)
    const r = await actualizarClienteBasico(form.id, payload)
    setSaving(false)
    if (r.success) {
      setOk("Cliente actualizado.")
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
          <CardTitle className="text-base">Información del sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onGuardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Id</Label>
              <Input value={form.id} disabled />
            </div>

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
              <Label>EmpresaId</Label>
              <Input type="number" value={form.empresaid} onChange={(e) => update("empresaid", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => update("nombre", e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Apellidos</Label>
              <Input value={form.apellidos} onChange={(e) => update("apellidos", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Telefono</Label>
              <Input value={form.telefono} maxLength={20} onChange={(e) => update("telefono", e.target.value)} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Direccion</Label>
              <Input value={form.direccion} onChange={(e) => update("direccion", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>PaisId</Label>
              <Input type="number" value={form.paisid} onChange={(e) => update("paisid", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>EstadoId</Label>
              <Input type="number" value={form.estadoid} onChange={(e) => update("estadoid", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>CiudadId</Label>
              <Input type="number" value={form.ciudadid} onChange={(e) => update("ciudadid", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>CodigoPostal</Label>
              <Input value={form.codigopostal} onChange={(e) => update("codigopostal", e.target.value)} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Fuente</Label>
              <Select value={form.fuente} onValueChange={(v) => update("fuente", v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona fuente" /></SelectTrigger>
                <SelectContent>
                  {FUENTES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="md:col-span-2 rounded-md border border-red-500/40 bg-red-500/10 text-red-700 px-4 py-2 text-sm">
                {error}
              </div>
            )}
            {ok && (
              <div className="md:col-span-2 rounded-md border border-green-500/40 bg-green-500/10 text-green-700 px-4 py-2 text-sm">
                {ok}
              </div>
            )}

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/clientes/ver/${form.id}`)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
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
