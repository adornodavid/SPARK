"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText,
  TrendingUp,
  DollarSign,
  UserPlus,
  Clock,
  Phone,
  Mail,
  Users,
  MapPin,
  CheckSquare,
  ArrowRight,
  Calendar,
  Activity,
  AlertTriangle,
  ChevronRight,
  Flame,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { obtenerDashboardCRM } from "@/app/actions/crm"
import type { oCRMDashboard, oActividad, oTimelineEntry } from "@/types/crm"
import { ETAPAS_PIPELINE } from "@/types/crm"
import { toast } from "sonner"
import { completarActividad } from "@/app/actions/crm"

const activityIcons: Record<string, any> = {
  Phone, Mail, Users, MapPin, FileText, Clock, CheckSquare,
  llamada: Phone,
  email: Mail,
  reunion: Users,
  visita: MapPin,
  envio_cotizacion: FileText,
  seguimiento: Clock,
  tarea: CheckSquare,
}

const timelineIcons: Record<string, any> = {
  FileText, Calendar, Activity, ArrowRight,
}

interface CRMDashboardContentProps {
  session: any
}

export function CRMDashboardContent({ session }: CRMDashboardContentProps) {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<oCRMDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  const vendedorId = session?.RolId && Number(session.RolId) >= 3
    ? Number(session.UsuarioId)
    : undefined

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    const result = await obtenerDashboardCRM(vendedorId)
    if (result.success && result.data) {
      setDashboard(result.data)
    }
    setLoading(false)
  }

  async function handleCompleteActivity(actId: number) {
    const result = await completarActividad(actId, "Completada desde dashboard")
    if (result.success) {
      toast.success("Actividad completada")
      loadDashboard()
    } else {
      toast.error(result.error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground mt-1">Panel de ventas y seguimiento comercial</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="spark-card p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground mt-1">Panel de ventas y seguimiento comercial</p>
        </div>
        <div className="spark-card p-12 text-center">
          <p className="text-muted-foreground">No se pudo cargar el dashboard. Intenta de nuevo.</p>
          <Button onClick={loadDashboard} className="mt-4 bg-foreground text-background hover:bg-foreground/90">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const { kpis, pipelineResumen, actividadesHoy, cotizacionesPorVencer, actividadReciente } = dashboard

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground mt-1">Panel de ventas y seguimiento comercial</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/crm/pipeline">
              Ver Pipeline
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
            <Link href="/cotizaciones/new">
              <FileText className="mr-2 h-4 w-4" />
              Nueva Cotizacion
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          titulo="Cotizaciones del Mes"
          valor={kpis.cotizacionesDelMes.toString()}
          icono={<FileText className="h-5 w-5" />}
          color="text-primary"
        />
        <KPICard
          titulo="Tasa Conversion"
          valor={`${kpis.tasaConversion}%`}
          icono={<TrendingUp className="h-5 w-5" />}
          color="text-emerald-600"
        />
        <KPICard
          titulo="Revenue Mensual"
          valor={`$${kpis.revenueMensual.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`}
          icono={<DollarSign className="h-5 w-5" />}
          color="text-primary"
        />
        <KPICard
          titulo="Clientes Nuevos"
          valor={kpis.clientesNuevos.toString()}
          icono={<UserPlus className="h-5 w-5" />}
          color="text-blue-600"
        />
        <KPICard
          titulo="Dias Prom. para Cerrar"
          valor={kpis.diasPromedioParaCerrar.toString()}
          icono={<Clock className="h-5 w-5" />}
          color="text-amber-600"
        />
      </div>

      {/* Mini Pipeline Bar */}
      <div className="spark-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pipeline</h2>
          <Link href="/crm/pipeline" className="text-sm text-primary hover:underline">
            Ver completo
          </Link>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {pipelineResumen.filter(p => !["realizada", "perdida"].includes(p.etapa)).map((stage) => {
            const etapaInfo = ETAPAS_PIPELINE.find(e => e.id === stage.etapa)
            return (
              <Link
                key={stage.etapa}
                href={`/crm/pipeline?etapa=${stage.etapa}`}
                className="flex-1 min-w-[100px] rounded-lg p-3 text-center transition-all hover:scale-[1.02] border border-border/50 bg-card hover:shadow-md"
              >
                <div className="text-lg font-bold">{stage.cantidad}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {etapaInfo?.nombre || stage.etapa}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  ${(stage.monto / 1000).toFixed(0)}k
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Two-column layout: Activities Today + Cotizaciones por Vencer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividades de Hoy */}
        <div className="spark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Actividades de Hoy
            </h2>
            <Link href="/crm/actividades" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          {actividadesHoy.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Sin actividades para hoy</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.push("/crm/actividades")}
              >
                Programar actividad
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {actividadesHoy.slice(0, 5).map((act) => {
                const IconComp = activityIcons[act.tipo] || Activity
                return (
                  <div key={act.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{act.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        {act.hora || "Sin hora"} {act.clienteNombre ? `— ${act.clienteNombre}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                      onClick={() => handleCompleteActivity(act.id)}
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cotizaciones por Vencer */}
        <div className="spark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Cotizaciones por Vencer
            </h2>
            <Link href="/cotizaciones" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          {cotizacionesPorVencer.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Sin cotizaciones proximas a vencer</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cotizacionesPorVencer.slice(0, 6).map((cot: any) => (
                <Link
                  key={cot.id}
                  href={`/cotizaciones/${cot.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex-shrink-0 h-2 w-2 rounded-full ${
                    cot.diasRestantes > 3 ? "bg-emerald-500" : cot.diasRestantes >= 2 ? "bg-amber-500" : "bg-destructive"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cot.folio} — {cot.nombreevento}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cot.cliente || "Sin cliente"} | {cot.hotel}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${cot.colorIndicador}`}>
                      {cot.diasRestantes}d
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${Number(cot.totalmonto || 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="spark-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Actividad Reciente
          </h2>
        </div>

        {actividadReciente.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Sin actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actividadReciente.map((entry) => {
              const IconComp = timelineIcons[entry.icono] || Activity
              return (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center`}>
                      <IconComp className={`h-4 w-4 ${entry.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.titulo}</p>
                    {entry.descripcion && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.descripcion}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(entry.fecha)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ==================================================
  Sub-components
================================================== */
function KPICard({
  titulo,
  valor,
  icono,
  color,
}: {
  titulo: string
  valor: string
  icono: React.ReactNode
  color: string
}) {
  return (
    <div className="spark-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{titulo}</span>
        <span className={color}>{icono}</span>
      </div>
      <div className="text-2xl font-bold">{valor}</div>
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Ahora"
  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}
