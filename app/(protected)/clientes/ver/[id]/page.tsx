"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Database, Cloud, Edit, Loader2 } from "lucide-react"
import Link from "next/link"
import { obtenerClienteConPipedrive } from "@/app/actions/clientes"

type AnyRec = Record<string, unknown>
type Lookups = { empresa: string | null; pais: string | null; estado: string | null; ciudad: string | null }

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "boolean") return v ? "Sí" : "No"
  if (typeof v === "object") {
    try { return JSON.stringify(v, null, 2) } catch { return String(v) }
  }
  return String(v)
}

function isJsonish(v: unknown): boolean {
  return typeof v === "object" && v !== null
}

function Row({ label, v }: { label: string; v: unknown }) {
  const json = isJsonish(v)
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-border/30 last:border-0">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`col-span-2 text-sm break-words ${json ? "font-mono text-xs whitespace-pre-wrap bg-muted/40 rounded p-2" : ""}`}>
        {fmt(v)}
      </div>
    </div>
  )
}

// Orden y etiquetas antes de la línea divisoria (hasta Fuente inclusive)
const ORDEN_SUPERIOR: Array<{ key: string; label: string; lookup?: keyof Lookups }> = [
  { key: "id", label: "Id" },
  { key: "tipo", label: "Tipo" },
  { key: "empresaid", label: "EmpresaId" },
  { key: "__empresa", label: "Empresa", lookup: "empresa" },
  { key: "nombre", label: "Nombre" },
  { key: "apellidos", label: "Apellidos" },
  { key: "email", label: "Email" },
  { key: "telefono", label: "Telefono" },
  { key: "direccion", label: "Direccion" },
  { key: "paisid", label: "PaisId" },
  { key: "__pais", label: "Pais", lookup: "pais" },
  { key: "estadoid", label: "EstadoId" },
  { key: "__estado", label: "Estado", lookup: "estado" },
  { key: "ciudadid", label: "CiudadId" },
  { key: "__ciudad", label: "Ciudad", lookup: "ciudad" },
  { key: "codigopostal", label: "CodigoPostal" },
  { key: "fuente", label: "Fuente" },
]

// Campos a ocultar en el resto del render automático
const EXCLUIR = new Set<string>([
  "apellidopaterno",
  "apellidomaterno",
  "celular",
  // ya renderizados arriba
  "id", "tipo", "empresaid", "nombre", "apellidos", "email", "telefono",
  "direccion", "paisid", "estadoid", "ciudadid", "codigopostal", "fuente",
])

export default function VerClientePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const idNum = Number(params?.id)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cliente, setCliente] = useState<AnyRec | null>(null)
  const [pipPerson, setPipPerson] = useState<AnyRec | null>(null)
  const [lookups, setLookups] = useState<Lookups>({ empresa: null, pais: null, estado: null, ciudad: null })

  useEffect(() => {
    async function load() {
      if (!Number.isFinite(idNum) || idNum <= 0) {
        setError("Id inválido")
        setLoading(false)
        return
      }
      const r = await obtenerClienteConPipedrive(idNum)
      if (!r.success) setError(r.error || "Error desconocido")
      else {
        setCliente((r.cliente ?? null) as AnyRec | null)
        setPipPerson((r.pipPerson ?? null) as AnyRec | null)
        if (r.lookups) setLookups(r.lookups as Lookups)
      }
      setLoading(false)
    }
    load()
  }, [idNum])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-10 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <div className="mx-auto max-w-6xl py-10 space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al listado
        </Button>
        <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-700 px-4 py-3 text-sm">
          {error || "Cliente no encontrado"}
        </div>
      </div>
    )
  }

  const camposRestantes = Object.keys(cliente).filter((k) => !EXCLUIR.has(k))
  const pipKeys = pipPerson ? Object.keys(pipPerson) : []

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/clientes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Cliente #{cliente.id as number}
            </h1>
            <p className="text-sm text-muted-foreground">
              {(cliente.nombre as string) || "—"} {(cliente.apellidos as string) || ""}
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/clientes/${cliente.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Link>
        </Button>
      </div>

      {/* Sección 1: Información del sistema */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-emerald-500/10 p-2">
              <Database className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">Información del sistema</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Datos almacenados en la base de datos del sistema (tabla <span className="font-mono">clientes</span>).
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/30">
            {ORDEN_SUPERIOR.map((it) => (
              <Row
                key={it.label}
                label={it.label}
                v={it.lookup ? lookups[it.lookup] : cliente[it.key]}
              />
            ))}
          </div>

          <div className="my-4 border-t-2 border-dashed border-border" />

          <div className="divide-y divide-border/30">
            {camposRestantes.map((k) => (
              <Row key={k} label={k} v={cliente[k]} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sección 2: Información de Pipedrive */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-blue-500/10 p-2">
              <Cloud className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Información proveniente de Pipedrive</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Datos extraídos de Pipedrive y almacenados en la tabla especial <span className="font-mono">pip_persons</span>, usada como staging para insertarse en clientes tras un proceso especial.
              </p>
            </div>
            {pipPerson && <Badge variant="outline" className="ml-auto">{pipKeys.length} campos</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {!pipPerson ? (
            <div className="text-sm text-muted-foreground italic py-4">
              {cliente.pipedrive_id
                ? `Este cliente tiene pipedrive_id=${cliente.pipedrive_id} pero no se encontró un registro coincidente en pip_persons.`
                : "Este cliente no está vinculado a ningún registro de Pipedrive."}
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {pipKeys.map((k) => (
                <Row key={k} label={k} v={pipPerson[k]} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
