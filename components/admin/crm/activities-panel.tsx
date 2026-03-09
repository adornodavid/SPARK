"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  Phone,
  Mail,
  Users,
  MapPin,
  FileText,
  Clock,
  CheckSquare,
  Plus,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { obtenerActividadesPendientes, completarActividad } from "@/app/actions/crm"
import type { oActividad, TipoActividadId } from "@/types/crm"
import { TIPOS_ACTIVIDAD } from "@/types/crm"
import { toast } from "sonner"
import { NewActivityDialog } from "./new-activity-dialog"

const activityIcons: Record<string, any> = {
  llamada: Phone,
  email: Mail,
  reunion: Users,
  visita: MapPin,
  envio_cotizacion: FileText,
  seguimiento: Clock,
  tarea: CheckSquare,
}

type VistaActividad = "hoy" | "vencidas" | "proximas7" | "todas"

interface ActivitiesPanelProps {
  session: any
}

export function ActivitiesPanel({ session }: ActivitiesPanelProps) {
  const router = useRouter()
  const [actividades, setActividades] = useState<oActividad[]>([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<VistaActividad>("hoy")
  const [showNewActivity, setShowNewActivity] = useState(false)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [resultadoText, setResultadoText] = useState("")
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)

  const vendedorId = session?.RolId && Number(session.RolId) >= 3
    ? Number(session.UsuarioId)
    : undefined

  useEffect(() => {
    loadActividades()
  }, [vista])

  async function loadActividades() {
    setLoading(true)
    const result = await obtenerActividadesPendientes(vendedorId, vista)
    if (result.success && result.data) {
      setActividades(result.data)
    } else {
      setActividades([])
    }
    setLoading(false)
  }

  function openCompleteDialog(actId: number) {
    setCompletingId(actId)
    setResultadoText("")
    setShowCompleteDialog(true)
  }

  async function handleComplete() {
    if (!completingId) return
    const result = await completarActividad(completingId, resultadoText || "Completada")
    if (result.success) {
      toast.success("Actividad completada")
      setShowCompleteDialog(false)
      setCompletingId(null)
      loadActividades()
    } else {
      toast.error(result.error)
    }
  }

  const vistaLabels: Record<VistaActividad, { label: string; icon: any; color: string }> = {
    hoy: { label: "Hoy", icon: CalendarDays, color: "text-primary" },
    vencidas: { label: "Vencidas", icon: AlertTriangle, color: "text-destructive" },
    proximas7: { label: "Proximos 7 dias", icon: Clock, color: "text-amber-600" },
    todas: { label: "Todas", icon: Activity, color: "text-muted-foreground" },
  }

  const pendientes = actividades.filter(a => !a.completada)
  const completadas = actividades.filter(a => a.completada)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/crm")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Actividades</h1>
            <p className="text-sm text-muted-foreground">
              {pendientes.length} pendientes {vista === "vencidas" ? "(vencidas)" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewActivity(true)}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nueva Actividad
        </Button>
      </div>

      {/* Vista Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(vistaLabels) as VistaActividad[]).map((v) => {
          const info = vistaLabels[v]
          const Icon = info.icon
          const isActive = vista === v
          return (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-card border border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {info.label}
            </button>
          )
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Activities List */}
      {!loading && (
        <div className="space-y-6">
          {/* Pending Activities */}
          {pendientes.length === 0 && completadas.length === 0 ? (
            <div className="spark-card p-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-primary opacity-30" />
              <p className="text-muted-foreground">
                {vista === "hoy" ? "Sin actividades para hoy" :
                 vista === "vencidas" ? "Sin actividades vencidas" :
                 "Sin actividades"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowNewActivity(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Programar actividad
              </Button>
            </div>
          ) : (
            <>
              {/* Pending */}
              {pendientes.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Pendientes ({pendientes.length})
                  </h2>
                  <div className="space-y-2">
                    {pendientes.map((act) => (
                      <ActivityItem
                        key={act.id}
                        actividad={act}
                        onComplete={() => openCompleteDialog(act.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {completadas.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Completadas ({completadas.length})
                  </h2>
                  <div className="space-y-2 opacity-60">
                    {completadas.map((act) => (
                      <ActivityItem
                        key={act.id}
                        actividad={act}
                        completed
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* New Activity Dialog */}
      <NewActivityDialog
        open={showNewActivity}
        onOpenChange={setShowNewActivity}
        vendedorId={Number(session?.UsuarioId) || 0}
        onCreated={() => {
          loadActividades()
          setShowNewActivity(false)
        }}
      />

      {/* Complete Activity Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Completar Actividad</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Resultado o notas de la actividad..."
              value={resultadoText}
              onChange={(e) => setResultadoText(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleComplete}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Completar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==================================================
  Activity Item
================================================== */
function ActivityItem({
  actividad,
  onComplete,
  completed = false,
}: {
  actividad: oActividad
  onComplete?: () => void
  completed?: boolean
}) {
  const router = useRouter()
  const IconComp = activityIcons[actividad.tipo] || Clock
  const tipoInfo = TIPOS_ACTIVIDAD.find(t => t.id === actividad.tipo)

  const isOverdue = !actividad.completada && actividad.fecha < new Date().toISOString().split("T")[0]

  return (
    <div className={`spark-card p-4 flex items-center gap-4 group ${completed ? "line-through" : ""}`}>
      {/* Icon */}
      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
        completed
          ? "bg-muted"
          : isOverdue
          ? "bg-destructive/10"
          : "bg-primary/10"
      }`}>
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
        ) : (
          <IconComp className={`h-5 w-5 ${isOverdue ? "text-destructive" : "text-primary"}`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium ${completed ? "text-muted-foreground" : ""}`}>
            {actividad.descripcion}
          </p>
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Vencida
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>{tipoInfo?.nombre || actividad.tipo}</span>
          <span>
            {new Date(actividad.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
            {actividad.hora ? ` ${actividad.hora}` : ""}
          </span>
          {actividad.clienteNombre && <span>{actividad.clienteNombre}</span>}
        </div>
        {actividad.resultado && (
          <p className="text-xs text-muted-foreground mt-1 italic">Resultado: {actividad.resultado}</p>
        )}
      </div>

      {/* Actions */}
      {!completed && onComplete && (
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
          onClick={onComplete}
        >
          <CheckSquare className="h-4 w-4 mr-1" />
          Completar
        </Button>
      )}

      {actividad.clienteId && (
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => router.push(`/crm/clientes/${actividad.clienteId}`)}
        >
          <Users className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
