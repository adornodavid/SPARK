"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Users,
  DollarSign,
  User,
  Mail,
  Phone,
  CalendarIcon,
  Clock,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { obtenerElementosCotizacion, obtenerPlatillosCotizacion } from "@/app/actions/catalogos"
import { objetoSalon } from "@/app/actions/salones"
import { createBrowserClient } from "@/lib/supabase/client"
import type { oCotizacion } from "@/types/cotizaciones"

interface PresupuestoItem {
  concepto: string
  tipo: string
  precio: number
  iva: number
  servicio: number
  subtotal: number
  cantidad: number
  dias: number
  total: number
}

function calcularDiasEvento(fechaInicial: string, fechaFinal: string): number {
  if (!fechaInicial) return 1
  const inicio = new Date(fechaInicial + "T12:00:00")
  const fin = fechaFinal ? new Date(fechaFinal + "T12:00:00") : inicio
  const diff = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(diff + 1, 1)
}

function crearPresupuestoItem(concepto: string, tipo: string, costo: number, dias: number, servicio = 0, cantidad = 0): PresupuestoItem {
  const subtotal = costo
  const precio = subtotal > 0 ? subtotal / 1.16 : 0
  const iva = precio * 0.16
  const total = subtotal * (cantidad || 1)
  return { concepto, tipo, precio, iva, servicio, subtotal, cantidad, dias, total }
}

interface QuotationDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: oCotizacion | null
}

const statusStyles: Record<string, { label: string; className: string }> = {
  "Borrador": { label: "Borrador", className: "bg-slate-100 text-slate-700 border-slate-300" },
  "Borrador ": { label: "Borrador", className: "bg-slate-100 text-slate-700 border-slate-300" },
  "Enviada": { label: "Enviada", className: "bg-blue-100 text-blue-700 border-blue-300" },
  "Aprobada": { label: "Aprobada", className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  "Rechazada": { label: "Rechazada", className: "bg-red-100 text-red-700 border-red-300" },
  "Expirada": { label: "Expirada", className: "bg-amber-100 text-amber-700 border-amber-300" },
  "Cancelada": { label: "Cancelada", className: "bg-red-100 text-red-700 border-red-300" },
}

function getStatusStyle(estatus: string) {
  const trimmed = estatus?.trim() || ""
  return statusStyles[trimmed] || statusStyles[estatus] || { label: estatus, className: "bg-gray-100 text-gray-700 border-gray-300" }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatCurrency(value: string | number | null) {
  if (!value && value !== 0) return "$0.00"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "$0.00"
  return `$${num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Normalize section keys
const TIPO_A_SECCION: Record<string, string> = {
  alimento: "alimentos",
  platillo: "platillos",
  platillos: "platillos",
  bebida: "bebidas",
  cortesia: "cortesias",
  cortesias: "cortesias",
  servicio: "servicio",
}
function normalizarSeccion(tipo: string): string {
  const lower = tipo.toLowerCase().trim()
  return TIPO_A_SECCION[lower] ?? lower
}

// SVG icons matching the quotation-form style
const tipoIconMap: Record<string, JSX.Element> = {
  lugar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M3 21V7a2 2 0 012-2h3M21 21V7a2 2 0 00-2-2h-3M8 21V5a2 2 0 012-2h4a2 2 0 012 2v16" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  alimentos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 0v4m-4 2h8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  platillos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M3 12h18M3 12a9 9 0 0118 0M12 3v1m0 16v1M5 19l.5-.5M18.5 5.5l.5-.5M5 5l.5.5M18.5 18.5l.5.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  bebidas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M8 2l1 8H6L5 2h3zm11 0l-1 8h3l1-8h-3zM5 10h14l-1.5 10H6.5L5 10z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  mobiliario: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <rect x="3" y="10" width="18" height="4" rx="1"/>
      <path d="M5 14v4m14-4v4M3 10V8a2 2 0 012-2h14a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  servicio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
    </svg>
  ),
  cortesias: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <rect x="3" y="8" width="18" height="14" rx="1"/>
      <path d="M12 8V4m0 0C12 4 9 2 7 4m5 0c0 0 3-2 5 0" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="8" x2="12" y2="22"/>
      <line x1="3" y1="13" x2="21" y2="13"/>
    </svg>
  ),
  "beneficios adicionales": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  audiovisual: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="17 2 12 7 7 2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  complementos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

function getIcon(tipo: string) {
  const key = tipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
  return tipoIconMap[key] || tipoIconMap[key.split(" ")[0]] || tipoIconMap["servicio"]
}

export function QuotationDetailModal({ open, onOpenChange, quotation }: QuotationDetailModalProps) {
  const [elements, setElements] = useState<any[]>([])
  const [loadingElements, setLoadingElements] = useState(false)
  const [presupuestoItems, setPresupuestoItems] = useState<PresupuestoItem[]>([])

  useEffect(() => {
    if (open && quotation) {
      setLoadingElements(true)
      setPresupuestoItems([])
      loadData(quotation)
    }
    if (!open) {
      setElements([])
      setPresupuestoItems([])
    }
  }, [open, quotation])

  async function loadData(q: oCotizacion) {
    // Load elements
    const elemRes = await obtenerElementosCotizacion(q.id)
    if (elemRes.success && elemRes.data) {
      setElements(elemRes.data)
    }

    // Build presupuesto (same logic as quotation-form)
    const dias = calcularDiasEvento(q.fechainicio, q.fechafin)
    const numInvitados = Number(q.numeroinvitados) || 0
    const presItems: PresupuestoItem[] = []
    const supabase = createBrowserClient()

    // Platillos
    const platRes = await obtenerPlatillosCotizacion(q.id)
    if (platRes.success && platRes.data) {
      for (const pl of platRes.data) {
        const plTotal = pl.costo ? Number(pl.costo) : 0
        presItems.push(crearPresupuestoItem(pl.descripcion || pl.nombre || pl.elemento || "", "Platillo", plTotal, dias, 0, numInvitados))
      }
    }

    // Audiovisual
    const { data: avElems } = await supabase.from("elementosxcotizacion").select("*").eq("cotizacionid", q.id).eq("tipoelemento", "AudioVisual")
    if (avElems && avElems.length > 0) {
      const avIds = avElems.map((e: any) => e.elementoid)
      const { data: avData } = await supabase.from("audiovisual").select("id, nombre, costo").in("id", avIds)
      const avMap = new Map((avData || []).map((a: any) => [a.id, a]))
      for (const e of avElems) {
        const av = avMap.get(e.elementoid)
        const avTotal = av?.costo ? Number(av.costo) : 0
        presItems.push(crearPresupuestoItem(av?.nombre || "Audiovisual", "Audiovisual", avTotal, dias, 0, 1))
      }
    }

    // Complementos
    const { data: compElems } = await supabase.from("elementosxcotizacion").select("*").eq("cotizacionid", q.id).eq("tipoelemento", "Complemento")
    if (compElems && compElems.length > 0) {
      const compIds = compElems.map((e: any) => e.elementoid)
      const { data: compData } = await supabase.from("complementos").select("id, nombre, costo").in("id", compIds)
      const compMap = new Map((compData || []).map((c: any) => [c.id, c]))
      for (const e of compElems) {
        const comp = compMap.get(e.elementoid)
        const compTotal = comp?.costo ? Number(comp.costo) : 0
        presItems.push(crearPresupuestoItem(comp?.nombre || "Complemento", "Complemento", compTotal, dias, 0, numInvitados))
      }
    }

    // Salon al inicio
    if (q.salonid) {
      const salonRes = await objetoSalon(q.salonid)
      if (salonRes.success && salonRes.data) {
        const precioSalon = salonRes.data.preciopordia ? Number(salonRes.data.preciopordia) : 0
        presItems.unshift(crearPresupuestoItem(salonRes.data.nombre || "Salon", "Salon", precioSalon, dias, 0, 1))
      }
    }

    setPresupuestoItems(presItems)
    setLoadingElements(false)
  }

  if (!quotation) return null

  const statusStyle = getStatusStyle(quotation.estatus)

  // Group elements
  const grouped: Record<string, any[]> = {}
  for (const el of elements) {
    const key = normalizarSeccion(el.tipoelemento || "otros")
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(el)
  }
  // platillos renders as subsection of alimentos
  const grupos = Object.entries(grouped).filter(([tipo]) => tipo !== "platillos")
  const mitad = Math.ceil(grupos.length / 2)
  const leftGroups = grupos.slice(0, mitad)
  const rightGroups = grupos.slice(mitad)

  const renderGroup = (tipo: string, items: any[]) => {
    const icon = getIcon(tipo)
    return (
      <div key={tipo} className="border-b border-[#1a3d2e]/20 pb-5 last:border-b-0 last:pb-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 flex items-center justify-center text-[#1a3d2e]">{icon}</div>
          <h3 className="text-sm font-bold tracking-widest text-[#1a3d2e] uppercase">{tipo}</h3>
        </div>
        <div className="pl-11 space-y-1">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <p className={`text-sm ${item.destacado ? "text-[#b87333]" : "text-gray-600"}`}>
                {item.descripcion || item.nombre || item.elemento || ""}
              </p>
              {item.costo && (
                <span className="text-xs text-gray-500 flex-shrink-0">{formatCurrency(item.costo)}</span>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-400 italic">Sin elementos</p>
          )}
        </div>

        {/* Subseccion Platillos dentro de Alimentos */}
        {tipo === "alimentos" && grouped["platillos"] && grouped["platillos"].length > 0 && (
          <div className="mt-4 ml-11 border-l-2 border-[#1a3d2e]/20 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 flex items-center justify-center text-[#1a3d2e]">
                {tipoIconMap["platillos"]}
              </div>
              <h4 className="text-xs font-bold tracking-widest text-[#1a3d2e] uppercase">Platillos</h4>
            </div>
            <div className="space-y-1">
              {grouped["platillos"].map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${item.destacado ? "text-[#b87333]" : "text-gray-600"}`}>
                    {item.descripcion || item.nombre || item.elemento || ""}
                  </p>
                  {item.costo && (
                    <span className="text-xs text-gray-500 flex-shrink-0">{formatCurrency(item.costo)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-hidden p-0 gap-0">
        <DialogTitle className="sr-only">Detalle de Cotizacion {quotation.folio}</DialogTitle>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#1a3d2e] to-[#2d5a45] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-wide">{quotation.folio}</h2>
                <Badge variant="outline" className={`${statusStyle.className} border`}>
                  {statusStyle.label}
                </Badge>
              </div>
              <p className="text-white/70 text-sm mt-1">{quotation.nombreevento || "Sin nombre de evento"}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(90vh-72px)]">

          {/* Info cards */}
          <div className="px-6 pt-5 pb-4">
            <div className="grid grid-cols-3 gap-4">

              {/* Evento */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-transparent">
                  <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Nombre</span>
                    <p className="font-medium">{quotation.nombreevento || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Tipo</span>
                    <p className="font-medium">{quotation.tipoevento || "-"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground text-xs">Inicio</span>
                      <p className="font-medium text-xs">{formatDate(quotation.fechainicio)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Fin</span>
                      <p className="font-medium text-xs">{formatDate(quotation.fechafin)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-xs">{quotation.horainicio || "-"} - {quotation.horafin || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{quotation.numeroinvitados || "-"} personas</span>
                  </div>
                </CardContent>
              </Card>

              {/* Sede */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50 to-transparent">
                  <CardTitle className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Sede
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Hotel</span>
                    <p className="font-medium">{quotation.hotel || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Salon</span>
                    <p className="font-medium">{quotation.salon || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Montaje</span>
                    <p className="font-medium">{quotation.montaje || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Cliente */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-transparent">
                  <CardTitle className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Nombre</span>
                    <p className="font-medium">{quotation.cliente || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-xs">{(quotation as any).email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{(quotation as any).telefono || "-"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Elementos del paquete — same style as quotation-form */}
          <div className="px-6 pb-4">
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="text-gray-900 text-lg font-semibold">Elementos de la Cotizacion</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {loadingElements ? (
                  <p className="text-sm text-gray-500 text-center py-6">Cargando elementos...</p>
                ) : elements.length === 0 ? (
                  <div className="bg-[#f7f5f0] rounded-xl p-8 text-center">
                    <p className="text-sm text-gray-400">No hay elementos asignados a esta cotizacion</p>
                  </div>
                ) : (
                  <div className="bg-[#f7f5f0] rounded-xl p-8">
                    <div className="grid grid-cols-2 gap-x-12">
                      <div className="space-y-6">
                        {leftGroups.map(([tipo, items]) => renderGroup(tipo, items))}
                      </div>
                      <div className="space-y-6">
                        {rightGroups.map(([tipo, items]) => renderGroup(tipo, items))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Presupuesto — same style as quotation-form */}
          {presupuestoItems.length > 0 && (
            <div className="px-6 pb-5">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#1a3d2e]" />
                    Presupuesto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm table-fixed">
                      <colgroup>
                        <col className="w-[4%]" />
                        <col className="w-[22%]" />
                        <col className="w-[10%]" />
                        <col className="w-[11%]" />
                        <col className="w-[10%]" />
                        <col className="w-[10%]" />
                        <col className="w-[11%]" />
                        <col className="w-[8%]" />
                        <col className="w-[6%]" />
                        <col className="w-[12%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-[#1a3d2e] text-white">
                          <th className="text-left px-2 py-3 font-medium">#</th>
                          <th className="text-left px-2 py-3 font-medium">Concepto</th>
                          <th className="text-left px-2 py-3 font-medium">Tipo</th>
                          <th className="text-right px-2 py-3 font-medium">Precio</th>
                          <th className="text-right px-2 py-3 font-medium">IVA</th>
                          <th className="text-right px-2 py-3 font-medium">Servicio</th>
                          <th className="text-right px-2 py-3 font-medium">Subtotal</th>
                          <th className="text-center px-2 py-3 font-medium">Cant.</th>
                          <th className="text-center px-2 py-3 font-medium">Dias</th>
                          <th className="text-right px-2 py-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {presupuestoItems.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-2 py-2.5 text-gray-500">{index + 1}</td>
                            <td className="px-2 py-2.5 text-gray-900 font-medium truncate">{item.concepto}</td>
                            <td className="px-2 py-2.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
                                item.tipo === "Salon" ? "bg-blue-100 text-blue-700" :
                                item.tipo === "Platillo" ? "bg-orange-100 text-orange-700" :
                                item.tipo === "Audiovisual" ? "bg-purple-100 text-purple-700" :
                                item.tipo === "Complemento" ? "bg-teal-100 text-teal-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {item.tipo}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 text-right text-gray-900 tabular-nums">
                              {item.precio > 0 ? formatCurrency(item.precio) : "Por definir"}
                            </td>
                            <td className="px-2 py-2.5 text-right text-gray-500 tabular-nums">
                              {item.iva > 0 ? formatCurrency(item.iva) : "-"}
                            </td>
                            <td className="px-2 py-2.5 text-right text-gray-500 tabular-nums">
                              {item.servicio > 0 ? formatCurrency(item.servicio) : "-"}
                            </td>
                            <td className="px-2 py-2.5 text-right text-gray-900 tabular-nums">
                              {item.subtotal > 0 ? formatCurrency(item.subtotal) : "Por definir"}
                            </td>
                            <td className="px-2 py-2.5 text-center text-gray-900">{item.cantidad || "-"}</td>
                            <td className="px-2 py-2.5 text-center text-gray-900">{item.dias}</td>
                            <td className="px-2 py-2.5 text-right text-gray-900 font-medium tabular-nums">
                              {item.total > 0 ? formatCurrency(item.total) : "Por definir"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#1a3d2e]/5 border-t-2 border-[#1a3d2e]/20">
                          <td colSpan={9} className="px-3 py-3 text-right font-semibold text-gray-900">Total</td>
                          <td className="px-3 py-3 text-right font-bold text-[#1a3d2e] text-base">
                            {presupuestoItems.reduce((sum, i) => sum + i.total, 0) > 0
                              ? formatCurrency(presupuestoItems.reduce((sum, i) => sum + i.total, 0))
                              : "Por definir"}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {quotation.validohasta && (
                    <p className="text-xs text-gray-500 mt-3 text-right italic">
                      Valida hasta: {formatDate(quotation.validohasta)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notas */}
          {quotation.notas && (
            <div className="px-6 pb-5">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-900 text-sm font-semibold">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notas}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Meta */}
          <div className="px-6 pb-5 flex items-center justify-between text-xs text-gray-400">
            <span>Creada: {formatDate(quotation.fechacreacion)}</span>
            <span>Actualizada: {formatDate(quotation.fechaactualizacion)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
