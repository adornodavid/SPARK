"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pencil,
  ArrowLeft,
  RefreshCw,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  Percent,
  DollarSign,
  FileText,
  StickyNote,
  History,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  obtenerConvenio,
  eliminarConvenio,
  renovarConvenio,
  obtenerHistorialRenovaciones,
} from "@/app/actions/convenios"
import type { oConvenio } from "@/types/convenios"
import { ESTADO_CONFIG, APLICA_A_OPTIONS } from "@/types/convenios"

function StatusBadge({ estado }: { estado: string }) {
  const config = ESTADO_CONFIG[estado]
  if (!config) return <span>{estado}</span>
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  )
}

function formatDescuento(convenio: oConvenio): string {
  if (convenio.tipo_descuento === "porcentaje") {
    return `${convenio.descuento_valor}%`
  }
  return `$${Number(convenio.descuento_valor).toLocaleString("es-MX")} MXN`
}

export default function AgreementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [convenio, setConvenio] = useState<oConvenio | null>(null)
  const [historial, setHistorial] = useState<oConvenio[]>([])
  const [loading, setLoading] = useState(true)
  const [renovando, setRenovando] = useState(false)
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [nuevaVigencia, setNuevaVigencia] = useState({
    inicio: "",
    fin: "",
  })

  useEffect(() => {
    loadConvenio()
  }, [id])

  async function loadConvenio() {
    setLoading(true)
    const [convenioResult, historialResult] = await Promise.all([
      obtenerConvenio(id),
      obtenerHistorialRenovaciones(id),
    ])

    if (convenioResult.success && convenioResult.data) {
      setConvenio(convenioResult.data)
    } else {
      toast.error("Convenio no encontrado")
    }

    if (historialResult.success && historialResult.data) {
      setHistorial(historialResult.data)
    }

    setLoading(false)
  }

  async function handleDelete() {
    const result = await eliminarConvenio(id)
    if (result.success) {
      toast.success("Convenio eliminado correctamente")
      router.push("/agreements")
    } else {
      toast.error(result.error)
    }
  }

  async function handleRenew() {
    if (!nuevaVigencia.inicio || !nuevaVigencia.fin) {
      toast.error("Selecciona las nuevas fechas de vigencia")
      return
    }

    setRenovando(true)
    const result = await renovarConvenio(id, nuevaVigencia.inicio, nuevaVigencia.fin)

    if (result.success && result.data) {
      toast.success("Convenio renovado correctamente")
      setRenewDialogOpen(false)
      router.push(`/agreements/${result.data.id}`)
    } else {
      toast.error(result.error)
    }
    setRenovando(false)
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8">
        <div className="flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-3" />
          Cargando convenio...
        </div>
      </div>
    )
  }

  if (!convenio) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
          <p className="text-muted-foreground">Convenio no encontrado</p>
          <Link href="/agreements">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a convenios
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const aplicaALabel = APLICA_A_OPTIONS.find((o) => o.value === convenio.aplica_a)?.label || convenio.aplica_a

  // Calcular dias restantes
  const hoy = new Date()
  const fin = new Date(convenio.vigencia_fin)
  const diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/agreements">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{convenio.empresa}</h1>
            <StatusBadge estado={convenio.estado} />
            <span className="text-sm text-muted-foreground">v{convenio.version}</span>
          </div>
          <p className="text-muted-foreground ml-10">
            Creado el {new Date(convenio.fechacreacion).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Renovar */}
          <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Renovar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Renovar Convenio</DialogTitle>
                <DialogDescription>
                  Se creara una nueva version del convenio con {convenio.empresa}, manteniendo los mismos
                  terminos pero con nuevas fechas de vigencia.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nueva Fecha de Inicio</Label>
                  <Input
                    type="date"
                    value={nuevaVigencia.inicio}
                    onChange={(e) => setNuevaVigencia((prev) => ({ ...prev, inicio: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nueva Fecha de Fin</Label>
                  <Input
                    type="date"
                    value={nuevaVigencia.fin}
                    onChange={(e) => setNuevaVigencia((prev) => ({ ...prev, fin: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleRenew}
                  disabled={renovando}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {renovando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Renovando...
                    </>
                  ) : (
                    "Renovar Convenio"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Editar */}
          <Link href={`/agreements/${id}/edit`}>
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>

          {/* Eliminar */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" title="Eliminar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar convenio</AlertDialogTitle>
                <AlertDialogDescription>
                  Estas a punto de eliminar el convenio con <strong>{convenio.empresa}</strong>.
                  Esta accion no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descuento y vigencia */}
          <Card className="rounded-xl border-border/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {convenio.tipo_descuento === "porcentaje" ? (
                      <Percent className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Descuento</p>
                  <p className="text-2xl font-bold">{formatDescuento(convenio)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Aplica a</p>
                  <p className="text-lg font-semibold">{aplicaALabel}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Vigencia</p>
                  <p className="text-sm font-medium">
                    {new Date(convenio.vigencia_inicio).toLocaleDateString("es-MX")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    al {new Date(convenio.vigencia_fin).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Dias restantes</p>
                  <p className={`text-2xl font-bold ${diasRestantes <= 0 ? "text-red-600" : diasRestantes <= 30 ? "text-amber-600" : "text-emerald-600"}`}>
                    {diasRestantes <= 0 ? "Vencido" : diasRestantes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Condiciones */}
          {convenio.condiciones && (
            <Card className="rounded-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Condiciones del Convenio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{convenio.condiciones}</p>
              </CardContent>
            </Card>
          )}

          {/* Notas internas */}
          {convenio.notas && (
            <Card className="rounded-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  Notas Internas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {convenio.notas}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Historial de renovaciones */}
          {historial.length > 1 && (
            <Card className="rounded-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Renovaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {historial.map((version) => (
                    <div
                      key={version.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        version.id === convenio.id
                          ? "border-foreground/20 bg-muted/50"
                          : "border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          v{version.version}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(version.vigencia_inicio).toLocaleDateString("es-MX")} -{" "}
                            {new Date(version.vigencia_fin).toLocaleDateString("es-MX")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDescuento(version)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge estado={version.estado} />
                        {version.id !== convenio.id && (
                          <Link href={`/agreements/${version.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs">
                              Ver
                            </Button>
                          </Link>
                        )}
                        {version.id === convenio.id && (
                          <span className="text-xs text-muted-foreground font-medium">Actual</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: contact info & hotel */}
        <div className="space-y-6">
          {/* Contacto */}
          <Card className="rounded-xl border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {convenio.contacto && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Persona de contacto</p>
                    <p className="font-medium">{convenio.contacto}</p>
                  </div>
                </div>
              )}
              {convenio.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${convenio.email}`} className="font-medium text-sm hover:underline">
                      {convenio.email}
                    </a>
                  </div>
                </div>
              )}
              {convenio.telefono && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefono</p>
                    <a href={`tel:${convenio.telefono}`} className="font-medium text-sm hover:underline">
                      {convenio.telefono}
                    </a>
                  </div>
                </div>
              )}
              {!convenio.contacto && !convenio.email && !convenio.telefono && (
                <p className="text-sm text-muted-foreground">Sin informacion de contacto</p>
              )}
            </CardContent>
          </Card>

          {/* Hotel */}
          <Card className="rounded-xl border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Hotel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {convenio.hotel ? (
                <p className="font-medium">{convenio.hotel}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aplica a todos los hoteles del grupo
                </p>
              )}
            </CardContent>
          </Card>

          {/* Info adicional */}
          <Card className="rounded-xl border-border/50">
            <CardHeader>
              <CardTitle>Informacion del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono">{convenio.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>{convenio.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>
                  {new Date(convenio.fechacreacion).toLocaleDateString("es-MX")}
                </span>
              </div>
              {convenio.fechaactualizacion && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actualizado</span>
                  <span>
                    {new Date(convenio.fechaactualizacion).toLocaleDateString("es-MX")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
