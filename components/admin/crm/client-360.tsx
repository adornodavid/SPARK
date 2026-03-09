"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileText,
  Calendar,
  Activity,
  ArrowRight,
  Clock,
  CheckSquare,
  Flame,
  Thermometer,
  Snowflake,
  Plus,
  User,
  Tag,
  DollarSign,
  MessageSquare,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { obtenerCliente360 } from "@/app/actions/crm"
import type { oCliente360, oTimelineEntry, oActividad, ScoringLevel } from "@/types/crm"
import { SCORING_LEVELS } from "@/types/crm"
import { toast } from "sonner"
import { NewActivityDialog } from "./new-activity-dialog"

const scoringIcons: Record<string, any> = {
  caliente: Flame,
  tibio: Thermometer,
  frio: Snowflake,
}

const timelineIcons: Record<string, any> = {
  FileText,
  Calendar,
  Activity,
  ArrowRight,
  Phone,
  Mail,
  Users,
  MapPin,
  Clock,
  CheckSquare,
}

interface Client360ViewProps {
  session: any
  clienteId: number
}

export function Client360View({ session, clienteId }: Client360ViewProps) {
  const router = useRouter()
  const [data, setData] = useState<oCliente360 | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewActivity, setShowNewActivity] = useState(false)
  const [activeTab, setActiveTab] = useState("timeline")

  useEffect(() => {
    loadClient()
  }, [clienteId])

  async function loadClient() {
    setLoading(true)
    const result = await obtenerCliente360(clienteId)
    if (result.success && result.data) {
      setData(result.data)
    } else {
      toast.error(result.error || "Error cargando perfil del cliente")
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="spark-card p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/5"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Regresar
        </Button>
        <div className="spark-card p-12 text-center">
          <p className="text-muted-foreground">Cliente no encontrado</p>
        </div>
      </div>
    )
  }

  const { cliente, scoring, tags, timeline, cotizaciones, reservaciones, actividades, estadisticas } = data
  const scoringInfo = SCORING_LEVELS.find(s => s.id === scoring)
  const ScoringIcon = scoringIcons[scoring] || Thermometer
  const nombreCompleto = `${cliente.nombre || ""} ${cliente.apellidopaterno || ""} ${cliente.apellidomaterno || ""}`.trim()

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Regresar
      </Button>

      {/* Header Card */}
      <div className="spark-card p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left: Client info */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{nombreCompleto}</h1>
                {scoringInfo && (
                  <Badge className={`${scoringInfo.color} border-none`}>
                    <ScoringIcon className="h-3 w-3 mr-1" />
                    {scoringInfo.nombre}
                  </Badge>
                )}
              </div>
              {cliente.compañia && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <Building2 className="h-4 w-4" />
                  {cliente.compañia}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Contact info + Quick Actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {cliente.email && (
                <a href={`mailto:${cliente.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4" />
                  {cliente.email}
                </a>
              )}
              {cliente.telefono && (
                <a href={`tel:${cliente.telefono}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4" />
                  {cliente.telefono}
                </a>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/cotizaciones/new?clienteId=${clienteId}`}>
                  <FileText className="h-4 w-4 mr-1" />
                  Nueva Cotizacion
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewActivity(true)}>
                <Calendar className="h-4 w-4 mr-1" />
                Agendar Actividad
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewActivity(true)}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Agregar Nota
              </Button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
          <StatItem label="Cotizaciones" value={estadisticas.totalCotizaciones.toString()} />
          <StatItem label="Reservaciones" value={estadisticas.totalReservaciones.toString()} />
          <StatItem label="Monto Total" value={`$${estadisticas.montoTotal.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`} />
          <StatItem
            label="Ultima Actividad"
            value={estadisticas.ultimaActividad
              ? new Date(estadisticas.ultimaActividad).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
              : "Sin actividad"}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="timeline">
            <Activity className="h-4 w-4 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="info">
            <User className="h-4 w-4 mr-1" />
            Info
          </TabsTrigger>
          <TabsTrigger value="cotizaciones">
            <FileText className="h-4 w-4 mr-1" />
            Cotizaciones ({cotizaciones.length})
          </TabsTrigger>
          <TabsTrigger value="reservaciones">
            <Calendar className="h-4 w-4 mr-1" />
            Reservaciones ({reservaciones.length})
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4">
          <div className="spark-card p-5">
            {timeline.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>Sin actividad registrada</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-4">
                  {timeline.map((entry) => {
                    const IconComp = timelineIcons[entry.icono] || Activity
                    return (
                      <div key={entry.id} className="flex gap-4 relative">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-card border border-border/50 flex items-center justify-center z-10`}>
                          <IconComp className={`h-4 w-4 ${entry.color}`} />
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{entry.titulo}</p>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {new Date(entry.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          {entry.descripcion && (
                            <p className="text-sm text-muted-foreground mt-0.5">{entry.descripcion}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4">
          <div className="spark-card p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Datos de Contacto</h3>
                <InfoRow label="Nombre" value={nombreCompleto} />
                <InfoRow label="Email" value={cliente.email || "—"} />
                <InfoRow label="Telefono" value={cliente.telefono || "—"} />
                <InfoRow label="Celular" value={cliente.celular || "—"} />
                <InfoRow label="Contacto Preferido" value={cliente.preferred_contact || "—"} />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informacion Comercial</h3>
                <InfoRow label="Tipo" value={cliente.tipo || "—"} />
                <InfoRow label="Fuente" value={cliente.fuente || "—"} />
                <InfoRow label="Compañia" value={cliente.compañia || "—"} />
                <InfoRow label="Direccion" value={cliente.direccion || "—"} />
                <InfoRow label="Codigo Postal" value={cliente.codigopostal || "—"} />
                <InfoRow label="Ciudad" value={cliente.ciudad || "—"} />
                <InfoRow label="Estado" value={cliente.estado || "—"} />
              </div>
            </div>
            {cliente.notas && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notas</h3>
                <p className="text-sm whitespace-pre-wrap">{cliente.notas}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Cotizaciones Tab */}
        <TabsContent value="cotizaciones" className="mt-4">
          <div className="spark-card overflow-hidden">
            {cotizaciones.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>Sin cotizaciones</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  asChild
                >
                  <Link href={`/cotizaciones/new?clienteId=${clienteId}`}>
                    <Plus className="h-4 w-4 mr-1" />
                    Crear Cotizacion
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Folio</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Evento</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Hotel</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Estatus</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Monto</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cotizaciones.map((cot: any) => (
                      <tr
                        key={cot.id}
                        className="border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/cotizaciones/${cot.id}`)}
                      >
                        <td className="p-3 text-sm font-mono">{cot.folio}</td>
                        <td className="p-3 text-sm">{cot.nombreevento}</td>
                        <td className="p-3 text-sm text-muted-foreground">{cot.hotel}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-xs">{cot.estatus}</Badge>
                        </td>
                        <td className="p-3 text-sm font-semibold text-right">
                          ${Number(cot.totalmonto || 0).toLocaleString("es-MX")}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {cot.fechainicio
                            ? new Date(cot.fechainicio).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Reservaciones Tab */}
        <TabsContent value="reservaciones" className="mt-4">
          <div className="spark-card overflow-hidden">
            {reservaciones.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>Sin reservaciones</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Folio</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Evento</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Hotel</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Estatus</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Monto</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservaciones.map((res: any) => (
                      <tr
                        key={res.id}
                        className="border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/reservaciones/${res.id}`)}
                      >
                        <td className="p-3 text-sm font-mono">{res.folio}</td>
                        <td className="p-3 text-sm">{res.nombreevento}</td>
                        <td className="p-3 text-sm text-muted-foreground">{res.hotel}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-xs">{res.estatus}</Badge>
                        </td>
                        <td className="p-3 text-sm font-semibold text-right">
                          ${Number(res.totalmonto || 0).toLocaleString("es-MX")}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {res.fechainicio
                            ? new Date(res.fechainicio).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Activity Dialog */}
      <NewActivityDialog
        open={showNewActivity}
        onOpenChange={setShowNewActivity}
        clienteId={clienteId}
        vendedorId={Number(session?.UsuarioId) || 0}
        onCreated={() => {
          loadClient()
          setShowNewActivity(false)
        }}
      />
    </div>
  )
}

/* ==================================================
  Sub-components
================================================== */
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-0.5">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}
