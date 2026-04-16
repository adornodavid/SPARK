"use client"

import { CardDescription } from "@/components/ui/card"
import { listaDesplegableClientes, objetoCliente, crearCliente } from "@/app/actions/clientes"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones, objetoSalon, objetoSalones } from "@/app/actions/salones"
import { crearCotizacion, actualizarCotizacion, objetoCotizacion, crearReservacion, actualizarReservacion, eliminarReservacion } from "@/app/actions/cotizaciones"
import { obtenerDisponibilidadSalon, obtenerReservacionesPorDia } from "@/app/actions/reservaciones"
import { AvailabilityCalendar } from "./availability-calendar"
import { listaDesplegableTipoEvento, listaDesplegablePaquetes, obtenerElementosPaquete, obtenerElementosCotizacion, asignarPaqueteACotizacion, eliminarElementoCotizacion, limpiarElementosCotizacion, buscarElementosPorTabla, buscarConsumoPorMenu, agregarElementoACotizacion, obtenerPrecioPaquetePorPlatillo, duplicarElementosReservacion, asignarPaqueteAReservacion, buscarLugaresPorHotel, modificarLugarCotizacion, listaEstatusCotizacion, obtenerDocumentoPDF, obtenerPlatillosCotizacion, buscarPlatillosItems, obtenerFormatoCotizacion, obtenerUsuarioSesionActual, obtenerEmpresaPorCliente, obtenerGrupoEmpresa, obtenerComplementosPorHotel, obtenerPlatilloItemPorId, obtenerAudiovisualPorHotel } from "@/app/actions/catalogos"
import { listaCategoriaEvento } from "@/app/actions/cotizaciones"
import { Users, MapPin, DollarSign, User, Mail, Phone, Building2, Check, X, CalendarIcon, FileText, UserPlus } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"

import React from "react"
import type { ddlItem } from "@/types/common"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuotationFormProps {
  quotationId?: string
}

// Normaliza tipoelemento de BD a la clave de sección del UI (plural, minúsculas)
const TIPO_A_SECCION: Record<string, string> = {
  alimento: "alimentos",
  platillo: "platillos",
  platillos: "platillos",
  bebida: "bebidas",
  consumo: "consumo",
  cortesia: "cortesias",
  cortesias: "cortesias",
  servicio: "servicio",
}
function normalizarSeccion(tipo: string): string {
  const lower = tipo.toLowerCase().trim()
  return TIPO_A_SECCION[lower] ?? lower
}

function calcularDiasEvento(fechaInicial: string, fechaFinal: string): number {
  if (!fechaInicial) return 1
  const inicio = new Date(fechaInicial + "T12:00:00")
  const fin = fechaFinal ? new Date(fechaFinal + "T12:00:00") : inicio
  const diff = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(diff + 1, 1)
}

async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = base64
  })
}

function crearPresupuestoItem(concepto: string, tipo: string, costo: number, dias: number, servicio = 0, cantidad = 0) {
  const subtotal = costo
  const precio = subtotal > 0 ? subtotal / 1.16 : 0
  const iva = precio * 0.16
  const total = (subtotal + servicio) * (cantidad || 1) * (dias || 1)
  return { concepto, tipo, precio, iva, servicio, subtotal, cantidad, dias, total }
}

// Horarios permitidos: 8:00 AM a 1:00 AM (intervalos de 30 min)
const HORARIOS_EVENTO = (() => {
  const slots: { value: string; label: string }[] = []
  for (let h = 8; h <= 23; h++) {
    for (const m of [0, 30]) {
      const hh = h.toString().padStart(2, "0")
      const mm = m.toString().padStart(2, "0")
      const h12 = h > 12 ? h - 12 : h
      const ampm = h < 12 ? "AM" : "PM"
      slots.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${ampm}` })
    }
  }
  slots.push({ value: "00:00", label: "12:00 AM" })
  slots.push({ value: "00:30", label: "12:30 AM" })
  slots.push({ value: "01:00", label: "1:00 AM" })
  slots.push({ value: "01:30", label: "1:30 AM" })
  slots.push({ value: "02:00", label: "2:00 AM" })
  return slots
})()

export function QuotationForm({ readOnly = false, initialEditId }: { readOnly?: boolean; initialEditId?: string } = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const effectiveEditId = searchParams.get("editId") || initialEditId || null
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdQuotationId, setCreatedQuotationId] = useState<number | null>(null)
  const [hoteles, setHoteles] = useState<ddlItem[]>([])
  const [salones, setSalones] = useState<ddlItem[]>([])
  const [montajes, setMontajes] = useState<{ value: string; text: string }[]>([])
  const [hasLoadedFromParams, setHasLoadedFromParams] = useState(false)
  const [pendingHotelId, setPendingHotelId] = useState<string | null>(null)
  const [pendingSalonId, setPendingSalonId] = useState<string | null>(null)
  const [pendingMontajeId, setPendingMontajeId] = useState<string | null>(null)
  const [pendingTipoEventoId, setPendingTipoEventoId] = useState<string | null>(null)
  const [clientes, setClientes] = useState<Array<{ value: string; text: string; email: string; telefono: string }>>([])
  const [filteredClientes, setFilteredClientes] = useState<Array<{ value: string; text: string; email: string; telefono: string }>>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState<string>("")
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)
  const [nuevoClienteLoading, setNuevoClienteLoading] = useState(false)
  const [nuevoClienteForm, setNuevoClienteForm] = useState({
    tipo: "",
    nombre: "",
    apellidopaterno: "",
    apellidomaterno: "",
    email: "",
    telefono: "",
    celular: "",
    direccion: "",
    empresa: "",
  })
  const [nuevoClienteError, setNuevoClienteError] = useState("")
  const [showPackageSection, setShowPackageSection] = useState(false)
  const [cotizacionId, setCotizacionId] = useState<number | null>(null)  // = reservacionid activo
  const [eventoId, setEventoId] = useState<number | null>(null)  // = eventos.id (compartido entre tabs)
  const [tiposEvento, setTiposEvento] = useState<ddlItem[]>([])
  const [categoriasEvento, setCategoriasEvento] = useState<{ id: number; nombre: string }[]>([])
  const [estatusList, setEstatusList] = useState<ddlItem[]>([])
  const [pendingEstatusId, setPendingEstatusId] = useState<string | null>(null)
  const [showPaqueteModal, setShowPaqueteModal] = useState(false)
  const [showLimpiarModal, setShowLimpiarModal] = useState(false)
  const [limpiarLoading, setLimpiarLoading] = useState(false)
  const [elementosPreviewPaquete, setElementosPreviewPaquete] = useState<any[]>([])
  const [loadingPreviewPaquete, setLoadingPreviewPaquete] = useState(false)
  const [previewPaqueteId, setPreviewPaqueteId] = useState<string>("")
  const [previewPaqueteInfo, setPreviewPaqueteInfo] = useState<any>(null)
  const [requerirHabitaciones, setRequerirHabitaciones] = useState(false)
  const [showConfirmReemplazarModal, setShowConfirmReemplazarModal] = useState(false)
  const [showConfirmEliminarModal, setShowConfirmEliminarModal] = useState(false)
  const [eliminarPendiente, setEliminarPendiente] = useState<{ tipoelemento: string; id: number; nombre: string } | null>(null)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfModalUrl, setPdfModalUrl] = useState<string>("")
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [paquetes, setPaquetes] = useState<any[]>([])
  const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>("")
  const [selectedPaqueteInfo, setSelectedPaqueteInfo] = useState<any>(null)
  const [elementosPaquete, setElementosPaquete] = useState<any[]>([])
  const [platillosItems, setPlatillosItems] = useState<any[]>([])
  const [seccionesPaquete, setSeccionesPaquete] = useState<string[]>([
    "lugar", "alimentos", "platillos", "bebidas", "cortesias", "mobiliario", "beneficios adicionales", "servicio",
  ])
  const [loadingPaquetes, setLoadingPaquetes] = useState(false)
  const [loadingElementos, setLoadingElementos] = useState(false)
  const [assigningPaquete, setAssigningPaquete] = useState(false)
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [showDuplicarReservacionModal, setShowDuplicarReservacionModal] = useState(false)
  const [showUnsavedBeforeGenerarModal, setShowUnsavedBeforeGenerarModal] = useState(false)
  const [showConfirmGenerarModal, setShowConfirmGenerarModal] = useState(false)
  const [generarSavingFromModal, setGenerarSavingFromModal] = useState(false)
  const [successModal, setSuccessModal] = useState<{ open: boolean; created: boolean }>({ open: false, created: false })
  const [agregarTipo, setAgregarTipo] = useState<string>("")
  // Tab activa dentro del modal de Alimentos (unifica Alimento + Platillos)
  const [alimentosTab, setAlimentosTab] = useState<string>("alimento")
  // tipomenu del menú actualmente seleccionado ("Completo" => 3 pestañas; "Individual" => 1 pestaña "Platillo")
  const [menuTipoActual, setMenuTipoActual] = useState<string | null>(null)
  // Grupos expandidos en la pestaña Alimento (agrupado por nombre)
  const [expandedAlimentoGroups, setExpandedAlimentoGroups] = useState<Set<string>>(new Set())
  // Expansión de opciones de horas/precios por bebida (consumo). Key = bebidaid.
  const [expandedConsumoBebidas, setExpandedConsumoBebidas] = useState<Set<number>>(new Set())
  // Selección de precio por bebida en el modal de Consumo. Key = bebidaid, valor = bebidaprecioid elegido.
  const [selectedBebidaPrecios, setSelectedBebidaPrecios] = useState<Record<number, number>>({})
  // Alimento "activo" al que se le están agregando platillos en el modal (permite multi-menú)
  const [selectedAlimentoParentId, setSelectedAlimentoParentId] = useState<number | null>(null)
  // Alimentos expandidos en la sección del paquete (muestra sus platillos)
  const [expandedAlimentos, setExpandedAlimentos] = useState<Set<number>>(new Set())
  // Mapa alimentoId → tipomenu ("Completo" | "Individual") para renderizar cada alimento correctamente
  const [alimentosTipoMenu, setAlimentosTipoMenu] = useState<Record<number, string>>({})
  // Mapa alimentoId → tiene al menos un platillo en la tabla platillos
  const [alimentosConPlatillos, setAlimentosConPlatillos] = useState<Record<number, boolean>>({})
  // Mapa bebidaId → tiene al menos una bebida (consumo) en la tabla bebidas
  const [bebidasConConsumo, setBebidasConConsumo] = useState<Record<number, boolean>>({})
  // Mapa menubebidaId → tipomenu para renderizar cada bebida correctamente
  const [bebidasTipoMenu, setBebidasTipoMenu] = useState<Record<number, string>>({})
  // Mapa consumo elementoid (bebidas.id) → menubebidaid para agrupar consumo por bebida padre
  const [consumoParentMap, setConsumoParentMap] = useState<Record<number, number>>({})
  // Bebidas expandidas en la sección del paquete
  const [expandedBebidas, setExpandedBebidas] = useState<Set<number>>(new Set())
  const [selectedElementoIds, setSelectedElementoIds] = useState<Set<number>>(new Set())
  const [previewElementoId, setPreviewElementoId] = useState<number | null>(null)
  const [previewElementoPdf, setPreviewElementoPdf] = useState<string>("")
  const [elementoSearch, setElementoSearch] = useState<string>("")
  // Modal compartido para platillos (entradas / plato fuerte / postres) — single-select por tipo
  const PLATILLOS_TIPOS = ["ENTRADAS", "PLATO FUERTE", "POSTRES"] as const
  type PlatilloTipo = typeof PLATILLOS_TIPOS[number]
  const [showPlatillosModal, setShowPlatillosModal] = useState(false)
  const [platillosActiveTipo, setPlatillosActiveTipo] = useState<PlatilloTipo>("ENTRADAS")
  const [platillosTabla, setPlatillosTabla] = useState<Record<PlatilloTipo, any[]>>({ "ENTRADAS": [], "PLATO FUERTE": [], "POSTRES": [] })
  const [platillosSeleccion, setPlatillosSeleccion] = useState<Record<PlatilloTipo, number | null>>({ "ENTRADAS": null, "PLATO FUERTE": null, "POSTRES": null })
  const [platillosSearch, setPlatillosSearch] = useState<string>("")
  const [platillosPreviewPdf, setPlatillosPreviewPdf] = useState<string>("")
  const [platillosPreviewId, setPlatillosPreviewId] = useState<number | null>(null)
  const [loadingPlatillosModal, setLoadingPlatillosModal] = useState(false)
  const [savingPlatillos, setSavingPlatillos] = useState(false)
  const [elementosTabla, setElementosTabla] = useState<any[]>([])
  const [loadingTabla, setLoadingTabla] = useState(false)
  const [selectedElementoId, setSelectedElementoId] = useState<string>("")
  const [savingElemento, setSavingElemento] = useState(false)
  const [salonFotos, setSalonFotos] = useState<string[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [calendarRange, setCalendarRange] = useState<DateRange | undefined>(undefined)
  const [salonReservaciones, setSalonReservaciones] = useState<{ fechainicio: string; fechafin: string; horainicio: string; horafin: string }[]>([])
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [reservacionesDia, setReservacionesDia] = useState<{ salon: string; fechainicio: string; fechafin: string; horainicio: string; horafin: string; estatus: string }[]>([])
  const [loadingResDia, setLoadingResDia] = useState(false)
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null)
  // Pestañas de reservaciones. Cada tab representa una row en eventoxreservaciones.
  const [reservacionTabs, setReservacionTabs] = useState<{ id?: number; label: string }[]>([{ label: "Reservación 1" }])
  const [activeReservacionIdx, setActiveReservacionIdx] = useState<number>(0)
  // Snapshots por tab (no re-render, solo persistencia entre cambios de pestaña)
  const tabSnapshotsRef = useRef<Record<number, any>>({})
  // Snapshot "baseline" de cada tab al último guardado (para detectar cambios sin guardar)
  const lastSavedTabSnapshotsRef = useRef<Record<number, any>>({})
  // Modal de cambios sin guardar al cambiar de pestaña
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingSwitchIdx, setPendingSwitchIdx] = useState<number | null>(null)
  const [savingFromModal, setSavingFromModal] = useState(false)
  const [presupuestoItems, setPresupuestoItems] = useState<{ concepto: string; tipo: string; precio: number; iva: number; servicio: number; subtotal: number; cantidad: number; dias: number; total: number }[]>([])
  const [audiovisualItems, setAudiovisualItems] = useState<any[]>([])
  const [showAudiovisualModal, setShowAudiovisualModal] = useState(false)
  const [audiovisualTabla, setAudiovisualTabla] = useState<any[]>([])
  const [loadingAudiovisual, setLoadingAudiovisual] = useState(false)
  const [selectedAudiovisualId, setSelectedAudiovisualId] = useState("")
  const [selectedAudiovisualIds, setSelectedAudiovisualIds] = useState<Set<number>>(new Set())
  const [audiovisualSearch, setAudiovisualSearch] = useState("")
  const [previewAudiovisualId, setPreviewAudiovisualId] = useState<number | null>(null)
  const [avPdfUrl, setAvPdfUrl] = useState("")
  const [savingAudiovisual, setSavingAudiovisual] = useState(false)
  const [complementoItems, setComplementoItems] = useState<any[]>([])
  const [showComplementoModal, setShowComplementoModal] = useState(false)
  const [complementoTabla, setComplementoTabla] = useState<any[]>([])
  const [loadingComplemento, setLoadingComplemento] = useState(false)
  const [selectedComplementoId, setSelectedComplementoId] = useState("")  // legacy single-select (fallback)
  const [selectedComplementoIds, setSelectedComplementoIds] = useState<Set<number>>(new Set())
  const [savingComplemento, setSavingComplemento] = useState(false)
  const [compPdfUrl, setCompPdfUrl] = useState("")
  const [previewComplementoId, setPreviewComplementoId] = useState<number | null>(null)
  const [complementoSearch, setComplementoSearch] = useState("")
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [requiereAutorizacion, setRequiereAutorizacion] = useState<"si" | "no" | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [loadingEditStep, setLoadingEditStep] = useState("")

  const [formData, setFormDataRaw] = useState({
    // Venue Selection
    hotel: "",
    salon: "",
    montaje: "",
    // Event Dates
    fechaInicial: "",
    fechaFinal: "",
    horaInicio: "",
    horaFin: "",
    horaPreMontaje: "",
    horaPostMontaje: "",
    horasExtras: "0",
    // Event Details
    nombreEvento: "",
    categoriaEvento: "",
    tipoEvento: "",
    estatusId: "",
    adultos: "",
    ninos: "",
    numeroInvitados: "",
    numeroHabitaciones: "",
    hospedajeFechaInicio: "",
    hospedajeFechaFin: "",
    // Client Information
    nombreCliente: "",
    empresa: "",
    grupo: "",
    email: "",
    telefono: "",
    subtotal: "",
    impuestos: "",
    descuentoPorcentaje: "",
    montoDescuento: "",
    totalMonto: "",
  })

  const setFormData = setFormDataRaw

  // Campos del formData que pertenecen a la reservación (no al evento). Al cambiar de tab estos se snapshotean.
  const perReservacionFormKeys = [
    "salon", "montaje",
    "fechaInicial", "fechaFinal",
    "horaInicio", "horaFin", "horaPreMontaje", "horaPostMontaje", "horasExtras",
    "nombreEvento",
    "adultos", "ninos", "numeroInvitados",
  ] as const

  const defaultPerResFormData: Record<(typeof perReservacionFormKeys)[number], string> = {
    salon: "", montaje: "",
    fechaInicial: "", fechaFinal: "",
    horaInicio: "", horaFin: "", horaPreMontaje: "", horaPostMontaje: "", horasExtras: "0",
    nombreEvento: "",
    adultos: "", ninos: "", numeroInvitados: "",
  }
  const defaultSeccionesPaquete = ["lugar", "alimentos", "platillos", "bebidas", "cortesias", "mobiliario", "beneficios adicionales", "servicio"]

  function captureCurrentTabSnapshot(): any {
    const fd: any = {}
    for (const k of perReservacionFormKeys) fd[k] = (formData as any)[k]
    return {
      formData: fd,
      presupuestoItems,
      elementosPaquete,
      platillosItems,
      audiovisualItems,
      complementoItems,
      selectedPaqueteId,
      selectedPaqueteInfo,
      seccionesPaquete,
      cotizacionId,
      salonReservaciones,
      reservacionesDia,
      diaSeleccionado,
      showPackageSection,
      calendarRange,
    }
  }

  function applyTabSnapshot(snap: any | null) {
    if (!snap) {
      // Tab nueva: reset a defaults (sin tocar campos de evento)
      setFormData(prev => ({ ...prev, ...defaultPerResFormData }))
      setPresupuestoItems([])
      setElementosPaquete([])
      setPlatillosItems([])
      setAudiovisualItems([])
      setComplementoItems([])
      setSelectedPaqueteId("")
      setSelectedPaqueteInfo(null)
      setSeccionesPaquete(defaultSeccionesPaquete)
      setCotizacionId(null)
      setSalonReservaciones([])
      setReservacionesDia([])
      setDiaSeleccionado(null)
      setShowPackageSection(false)
      setCalendarRange(undefined)
      return
    }
    setFormData(prev => ({ ...prev, ...snap.formData }))
    setPresupuestoItems(snap.presupuestoItems || [])
    setElementosPaquete(snap.elementosPaquete || [])
    setPlatillosItems(snap.platillosItems || [])
    setAudiovisualItems(snap.audiovisualItems || [])
    setComplementoItems(snap.complementoItems || [])
    setSelectedPaqueteId(snap.selectedPaqueteId || "")
    setSelectedPaqueteInfo(snap.selectedPaqueteInfo || null)
    setSeccionesPaquete(snap.seccionesPaquete || defaultSeccionesPaquete)
    setCotizacionId(snap.cotizacionId ?? null)
    setSalonReservaciones(snap.salonReservaciones || [])
    setReservacionesDia(snap.reservacionesDia || [])
    setDiaSeleccionado(snap.diaSeleccionado ?? null)
    setShowPackageSection(!!snap.showPackageSection)
    // Nota: los montajes del nuevo salón deben cargarse ANTES de llamar applyTabSnapshot
    // (ver performSwitchTab / handleDiscardAndSwitch). Si se cargaran aquí, entre setFormData
    // y setMontajes React renderiza una vez con value=montaje nuevo y options=antiguos;
    // Radix Select dispara onValueChange("") por falta de match y borra el valor.
    // Calendar range per-reservación: si el snapshot no lo trae, derivar de fechaInicial/fechaFinal
    if (snap.calendarRange) {
      setCalendarRange(snap.calendarRange)
    } else {
      const fi = snap.formData?.fechaInicial
      const ff = snap.formData?.fechaFinal
      if (fi || ff) {
        setCalendarRange({
          from: fi ? new Date(fi + "T12:00:00") : undefined,
          to: ff ? new Date(ff + "T12:00:00") : undefined,
        } as any)
      } else {
        setCalendarRange(undefined)
      }
    }
  }

  async function buildSnapshotFromReservacionId(reservacionid: number): Promise<any> {
    const supa = (await import("@/lib/supabase/client")).createClient()
    const { data: row } = await supa
      .from("eventoxreservaciones")
      .select("*")
      .eq("id", reservacionid)
      .maybeSingle()
    if (!row) return null

    const fd: any = {
      salon: row.salonid != null ? String(row.salonid) : "",
      montaje: row.montajeid != null ? String(row.montajeid) : "",
      fechaInicial: row.fechainicio ? String(row.fechainicio).slice(0, 10) : "",
      fechaFinal: row.fechafin ? String(row.fechafin).slice(0, 10) : "",
      horaInicio: row.horainicio ? String(row.horainicio).slice(0, 5) : "",
      horaFin: row.horafin ? String(row.horafin).slice(0, 5) : "",
      horaPreMontaje: row.horapremontaje ? String(row.horapremontaje).slice(0, 5) : "",
      horaPostMontaje: row.horapostmontaje ? String(row.horapostmontaje).slice(0, 5) : "",
      horasExtras: row.horasextras != null ? String(row.horasextras) : "0",
      nombreEvento: row.nombreevento || "",
      adultos: row.adultos != null ? String(row.adultos) : "",
      ninos: row.ninos != null ? String(row.ninos) : "",
      numeroInvitados: row.numeroinvitados != null ? String(row.numeroinvitados) : "",
    }

    // Elementos del paquete (tipoelemento distintos de Platillo)
    const elemRes = await obtenerElementosCotizacion(reservacionid)
    const elementos = elemRes.success && elemRes.data ? elemRes.data : []
    const platRes = await obtenerPlatillosCotizacion(reservacionid)
    const platillos = platRes.success && platRes.data ? platRes.data : []

    // Paquete
    let pqInfo: any = null
    if (row.paqueteid) {
      const { data: paqRow } = await supa
        .from("paquetes")
        .select("id, nombre, precioporpersona, tipopaquete")
        .eq("id", row.paqueteid)
        .maybeSingle()
      pqInfo = paqRow
    }

    // Presupuesto básico: paquete + salón
    const dias = calcularDiasEvento(fd.fechaInicial, fd.fechaFinal)
    const numInv = Number(fd.numeroInvitados) || 0
    const presItems: any[] = []
    if (row.paqueteid && pqInfo && platillos.length > 0) {
      // Determinar menú principal (Completo primero; sino el primero con platillos)
      const supa2 = (await import("@/lib/supabase/client")).createClient()
      const alimentosEls = (elementos || []).filter((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
      let menuPrincipal: any = null
      let menuPrincipalTipo = ""
      if (alimentosEls.length > 0) {
        const menuIds = alimentosEls.map((el: any) => Number(el.elementoid ?? el.id))
        const { data: menusData } = await supa2.from("menus").select("id, tipomenu").in("id", menuIds)
        const menuMap = new Map((menusData || []).map((m: any) => [Number(m.id), String(m.tipomenu || "")]))
        for (const alim of alimentosEls) {
          const alimId = Number(alim.elementoid ?? alim.id)
          if ((menuMap.get(alimId) || "").toLowerCase() === "completo") {
            menuPrincipal = alim; menuPrincipalTipo = menuMap.get(alimId) || ""
            break
          }
        }
        if (!menuPrincipal) {
          for (const alim of alimentosEls) {
            const alimId = Number(alim.elementoid ?? alim.id)
            if (platillos.some((p: any) => Number(p.platilloid) === alimId)) {
              menuPrincipal = alim; menuPrincipalTipo = menuMap.get(alimId) || ""
              break
            }
          }
        }
      }
      if (menuPrincipal) {
        const menuPrincipalId = Number(menuPrincipal.elementoid ?? menuPrincipal.id)
        const esCompleto = menuPrincipalTipo.toLowerCase() === "completo"
        const platillosDeEseMenu = platillos.filter((p: any) => Number(p.platilloid) === menuPrincipalId)
        const platilloClave = esCompleto
          ? platillosDeEseMenu.find((p: any) => (p.tipo || "").toUpperCase() === "PLATO FUERTE")
          : platillosDeEseMenu[0]
        if (platilloClave) {
          let precioPaquete = Number(pqInfo.precioporpersona ?? 0) || 0
          if (precioPaquete === 0) {
            const res = await obtenerPrecioPaquetePorPlatillo(Number(row.paqueteid), Number(platilloClave.elementoid ?? platilloClave.id))
            precioPaquete = res.precio || 0
          }
          const nombreMenu = menuPrincipal?.descripcion || menuPrincipal?.nombre || menuPrincipal?.elemento || pqInfo.nombre || "Paquete"
          presItems.push(crearPresupuestoItem(nombreMenu, "Paquete", precioPaquete, dias, 0, numInv))
        }
      }
    }
    if (row.salonid) {
      const salonRes = await objetoSalon(Number(row.salonid))
      if (salonRes.success && salonRes.data) {
        const precioSalon = salonRes.data.preciopordia ? Number(salonRes.data.preciopordia) : 0
        presItems.unshift(crearPresupuestoItem(salonRes.data.nombre || "Salón", "Salón", precioSalon, dias, 0, 1))
      }
    }

    // Audiovisual items asignados a esta reservación (elementosxcotizacion tipo "AudioVisual")
    const avItemsOut: any[] = []
    {
      const { data: avElems } = await supa
        .from("elementosxcotizacion")
        .select("*")
        .eq("reservacionid", reservacionid)
        .eq("tipoelemento", "AudioVisual")
      if (avElems && avElems.length > 0) {
        const ids = avElems.map((e: any) => e.elementoid).filter(Boolean)
        const { data: avData } = await supa.from("audiovisual").select("*").in("id", ids)
        const avMap = new Map((avData || []).map((a: any) => [a.id, a]))
        for (const e of avElems) {
          const av = avMap.get(e.elementoid)
          avItemsOut.push({ ...e, audiovisual: av || null })
          if (av) {
            const total = av.costo != null ? Number(av.costo) : 0
            presItems.push(crearPresupuestoItem(av.nombre || "Audiovisual", "Audiovisual", total, dias, 0, 1))
          }
        }
      }
    }

    // Complemento items asignados a esta reservación
    const compItemsOut: any[] = []
    {
      const { data: compElems } = await supa
        .from("elementosxcotizacion")
        .select("*")
        .eq("reservacionid", reservacionid)
        .eq("tipoelemento", "Complemento")
      if (compElems && compElems.length > 0) {
        const ids = compElems.map((e: any) => e.elementoid).filter(Boolean)
        const { data: compData } = await supa.from("complementos").select("id, nombre, costo").in("id", ids)
        const compMap = new Map((compData || []).map((c: any) => [c.id, c]))
        for (const e of compElems) {
          const c = compMap.get(e.elementoid) as any
          compItemsOut.push({ ...e, complemento: c || null })
          if (c) {
            const total = c.costo != null ? Number(c.costo) : 0
            presItems.push(crearPresupuestoItem(c.nombre || "Complemento", "Complemento", total, dias, 0, numInv))
          }
        }
      }
    }

    return {
      formData: fd,
      presupuestoItems: presItems,
      elementosPaquete: elementos,
      platillosItems: platillos,
      audiovisualItems: avItemsOut,
      complementoItems: compItemsOut,
      selectedPaqueteId: row.paqueteid != null ? String(row.paqueteid) : "",
      selectedPaqueteInfo: pqInfo,
      seccionesPaquete: defaultSeccionesPaquete,
      cotizacionId: reservacionid,
      salonReservaciones: [],
      reservacionesDia: [],
      diaSeleccionado: null,
      showPackageSection: true,
    }
  }

  async function performSwitchTab(nextIdx: number) {
    tabSnapshotsRef.current[activeReservacionIdx] = captureCurrentTabSnapshot()
    setActiveReservacionIdx(nextIdx)
    let snap = tabSnapshotsRef.current[nextIdx] ?? null
    if (!snap) {
      const tab = reservacionTabs[nextIdx]
      if (tab?.id) {
        setLoadingEdit(true)
        setLoadingEditStep("Cargando reservación...")
        snap = await buildSnapshotFromReservacionId(tab.id)
        if (snap) {
          tabSnapshotsRef.current[nextIdx] = snap
          lastSavedTabSnapshotsRef.current[nextIdx] = snap
        }
        setLoadingEdit(false)
      }
    }
    // Reconciliar con baseline: si el snapshot capturado tiene perRes keys vacías
    // pero el baseline las tiene con valor, usar las del baseline (evita pérdida de
    // datos por capturas incompletas durante transiciones de pendingSalonId/Montaje/etc).
    const baselineSnap = lastSavedTabSnapshotsRef.current[nextIdx]
    if (snap && baselineSnap?.formData) {
      const reconciled: any = { ...snap.formData }
      for (const k of perReservacionFormKeys) {
        const cur = reconciled[k]
        const base = baselineSnap.formData[k]
        if ((cur === "" || cur == null) && base != null && base !== "") {
          reconciled[k] = base
        }
      }
      snap = { ...snap, formData: reconciled }
      tabSnapshotsRef.current[nextIdx] = snap
    }
    // IMPORTANTE: cargar montajes del nuevo salón ANTES de applyTabSnapshot.
    // Sin esto, el render intermedio deja el <Select montaje> con value=X pero
    // options del salón anterior → Radix dispara onValueChange("") y borra el montaje.
    const snapSalon = snap?.formData?.salon
    if (snapSalon) {
      await loadMontajes(snapSalon, true)
    } else {
      setMontajes([])
    }
    applyTabSnapshot(snap)
  }

  async function switchToReservacionTab(nextIdx: number) {
    if (nextIdx === activeReservacionIdx) return
    if (!readOnly && isTabDirty(activeReservacionIdx)) {
      setPendingSwitchIdx(nextIdx)
      setShowUnsavedModal(true)
      return
    }
    await performSwitchTab(nextIdx)
  }

  async function handleConfirmSaveAndSwitch() {
    if (pendingSwitchIdx === null) return
    setSavingFromModal(true)
    const res = await saveCotizacion()
    setSavingFromModal(false)
    if (!res.success) {
      alert(`Error al actualizar cotización: ${res.error || ""}`)
      return
    }
    const idx = pendingSwitchIdx
    setShowUnsavedModal(false)
    setPendingSwitchIdx(null)
    await performSwitchTab(idx)
  }

  // Descarta cambios no guardados de la tab actual (restaura baseline) y cambia a la siguiente tab.
  async function handleDiscardAndSwitch() {
    if (pendingSwitchIdx === null) return
    const idx = pendingSwitchIdx
    const baseline = lastSavedTabSnapshotsRef.current[activeReservacionIdx]
    // Restaurar en memoria (tabSnapshotsRef) para que al volver no aparezcan los cambios descartados
    const currentCapture = captureCurrentTabSnapshot()
    if (baseline?.formData) {
      tabSnapshotsRef.current[activeReservacionIdx] = {
        ...currentCapture,
        formData: { ...currentCapture.formData, ...baseline.formData },
      }
    } else {
      tabSnapshotsRef.current[activeReservacionIdx] = currentCapture
    }
    setShowUnsavedModal(false)
    setPendingSwitchIdx(null)
    // Cambiar de tab sin ejecutar la captura automática (ya la guardamos manualmente arriba)
    setActiveReservacionIdx(idx)
    let snap = tabSnapshotsRef.current[idx] ?? null
    if (!snap) {
      const tab = reservacionTabs[idx]
      if (tab?.id) {
        setLoadingEdit(true)
        setLoadingEditStep("Cargando reservación...")
        snap = await buildSnapshotFromReservacionId(tab.id)
        if (snap) {
          tabSnapshotsRef.current[idx] = snap
          lastSavedTabSnapshotsRef.current[idx] = snap
        }
        setLoadingEdit(false)
      }
    }
    // Cargar montajes del nuevo salón ANTES de applyTabSnapshot (ver nota en performSwitchTab)
    const snapSalon2 = snap?.formData?.salon
    if (snapSalon2) {
      await loadMontajes(snapSalon2, true)
    } else {
      setMontajes([])
    }
    applyTabSnapshot(snap)
  }

  function renderReservacionTabs() {
    return (
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {reservacionTabs.map((tab, idx) => (
          <div
            key={idx}
            onClick={() => switchToReservacionTab(idx)}
            className={`group flex items-center gap-1 pl-4 pr-2 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
              idx === activeReservacionIdx
                ? "border-[#1a3d2e] text-[#1a3d2e]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <span>{tab.label}</span>
            {!readOnly && reservacionTabs.length > 1 && (
              <button
                type="button"
                onClick={(e) => handleEliminarReservacionTab(idx, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 rounded p-0.5"
                title="Eliminar reservación"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }

  async function handleEliminarReservacionTab(idx: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (reservacionTabs.length <= 1) {
      alert("Un evento debe tener al menos una reservación.")
      return
    }
    const tab = reservacionTabs[idx]
    const snap = idx === activeReservacionIdx ? captureCurrentTabSnapshot() : tabSnapshotsRef.current[idx]
    const tieneDatos = !!(snap && (
      (snap.elementosPaquete?.length ?? 0) > 0 ||
      (snap.platillosItems?.length ?? 0) > 0 ||
      snap.selectedPaqueteId ||
      snap.formData?.salon || snap.formData?.nombreEvento
    ))
    const msg = tieneDatos
      ? `¿Eliminar "${tab.label}"? Se perderán sus datos y elementos asignados.`
      : `¿Eliminar "${tab.label}"?`
    if (!confirm(msg)) return

    if (tab.id) {
      const res = await eliminarReservacion(tab.id)
      if (!res.success) {
        alert(`Error al eliminar reservación: ${res.error}`)
        return
      }
    }

    // Reconstruir tabs y snapshots sin el eliminado (y renumerar labels)
    const newTabs = reservacionTabs.filter((_, i) => i !== idx).map((t, i) => ({ ...t, label: `Reservación ${i + 1}` }))
    const newSnapshots: Record<number, any> = {}
    let shift = 0
    for (let i = 0; i < reservacionTabs.length; i++) {
      if (i === idx) { shift = 1; continue }
      if (tabSnapshotsRef.current[i]) newSnapshots[i - shift] = tabSnapshotsRef.current[i]
    }
    tabSnapshotsRef.current = newSnapshots

    let newActiveIdx = activeReservacionIdx
    if (idx === activeReservacionIdx) {
      newActiveIdx = Math.max(0, idx - 1)
      const snapToApply = newSnapshots[newActiveIdx] ?? null
      if (!snapToApply && newTabs[newActiveIdx]?.id) {
        setLoadingEdit(true)
        setLoadingEditStep("Cargando reservación...")
        const built = await buildSnapshotFromReservacionId(newTabs[newActiveIdx].id!)
        if (built) newSnapshots[newActiveIdx] = built
        setLoadingEdit(false)
        applyTabSnapshot(built)
      } else {
        applyTabSnapshot(snapToApply)
      }
    } else if (idx < activeReservacionIdx) {
      newActiveIdx = activeReservacionIdx - 1
    }
    setReservacionTabs(newTabs)
    setActiveReservacionIdx(newActiveIdx)
  }

  async function handleAgregarReservacion(duplicate: boolean = false) {
    tabSnapshotsRef.current[activeReservacionIdx] = captureCurrentTabSnapshot()
    const sourceSnapshot = captureCurrentTabSnapshot()
    const sourceReservacionId = cotizacionId
    const nextIdx = reservacionTabs.length
    // Si el evento ya existe en DB, crear la reservación inmediatamente
    let newResvId: number | undefined
    if (eventoId) {
      const basePayload = duplicate ? {
        nombreevento: formData.nombreEvento || null,
        tipoevento: formData.tipoEvento ? Number(formData.tipoEvento) : null,
        adultos: formData.adultos ? Number(formData.adultos) : null,
        ninos: formData.ninos ? Number(formData.ninos) : null,
        numeroinvitados: formData.numeroInvitados ? Number(formData.numeroInvitados) : null,
        estatusid: null,
        // Excluir: salón, montaje, fechas y horas
        salonid: null, montajeid: null,
        fechainicio: null, fechafin: null,
        horainicio: null, horafin: null,
        horapremontaje: null, horapostmontaje: null, horasextras: 0,
      } : {
        nombreevento: null, tipoevento: formData.tipoEvento ? Number(formData.tipoEvento) : null,
        adultos: null, ninos: null, numeroinvitados: null, estatusid: null,
        salonid: null, montajeid: null,
        fechainicio: null, fechafin: null,
        horainicio: null, horafin: null,
        horapremontaje: null, horapostmontaje: null, horasextras: 0,
      }
      const res = await crearReservacion(eventoId, basePayload)
      if (res.success) newResvId = res.data
      else alert(`Error al crear reservación: ${res.error}`)
    }

    // Si duplicar y tenemos newResvId: copiar elementosxcotizacion de la reservación fuente a la nueva + paqueteid
    if (duplicate && newResvId && sourceReservacionId) {
      try {
        if (selectedPaqueteId) {
          const rPaq = await asignarPaqueteAReservacion(newResvId, Number(selectedPaqueteId))
          if (!rPaq.success) console.error("Error asignando paqueteid:", rPaq.error)
        }
        const rDup = await duplicarElementosReservacion(sourceReservacionId, newResvId)
        if (!rDup.success) {
          console.error("Error duplicando elementos:", rDup.error)
          alert(`Error duplicando elementos del paquete: ${rDup.error}`)
        }
      } catch (e: any) {
        console.error("Error duplicando elementos:", e)
      }
    }

    setReservacionTabs(prev => [...prev, { id: newResvId, label: `Reservación ${prev.length + 1}` }])
    setActiveReservacionIdx(nextIdx)

    if (duplicate) {
      // Construir snapshot duplicado: conservar datos salvo fecha/salón/horas
      const fdDup: any = { ...sourceSnapshot.formData }
      fdDup.salon = ""; fdDup.montaje = ""
      fdDup.fechaInicial = ""; fdDup.fechaFinal = ""
      fdDup.horaInicio = ""; fdDup.horaFin = ""
      fdDup.horaPreMontaje = ""; fdDup.horaPostMontaje = ""
      fdDup.horasExtras = "0"
      const dupSnap = {
        ...sourceSnapshot,
        formData: fdDup,
        cotizacionId: newResvId ?? null,
        calendarRange: undefined,
        salonReservaciones: [],
        reservacionesDia: [],
      }
      applyTabSnapshot(dupSnap)
      // Tras aplicar, recargar desde DB los elementos duplicados para reflejar los nuevos ids
      if (newResvId) {
        const [elRes, platRes] = await Promise.all([
          obtenerElementosCotizacion(newResvId),
          obtenerPlatillosCotizacion(newResvId),
        ])
        if (elRes.success && elRes.data) setElementosPaquete(elRes.data)
        if (platRes.success && platRes.data) setPlatillosItems(platRes.data)
        cargarAudiovisualItems(newResvId)
        cargarComplementoItems(newResvId)
      }
    } else {
      applyTabSnapshot(null)
    }

    if (newResvId) {
      setCotizacionId(newResvId)
      setShowPackageSection(true)
    }
    // Baseline de la tab nueva
    lastSavedTabSnapshotsRef.current[nextIdx] = duplicate
      ? { formData: { ...defaultPerResFormData, nombreEvento: formData.nombreEvento || "", adultos: formData.adultos || "", ninos: formData.ninos || "", numeroInvitados: formData.numeroInvitados || "" } }
      : { formData: { ...defaultPerResFormData } }
    // Llevar al usuario al inicio de la página
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Sincroniza tipomenu para menubebidas y mapa de consumo→padre + flag de tiene consumo
  useEffect(() => {
    const bebidaIdsAll = elementosPaquete
      .filter((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "bebidas")
      .map((el: any) => Number(el.elementoid ?? el.id))
      .filter((id) => Number.isFinite(id))
    const bebidaIdsTipo = bebidaIdsAll.filter((id) => !(id in bebidasTipoMenu))
    const bebidaIdsConsumo = bebidaIdsAll.filter((id) => !(id in bebidasConConsumo))
    const consumoIds = elementosPaquete
      .filter((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "consumo")
      .map((el: any) => Number(el.elementoid ?? el.id))
      .filter((id) => Number.isFinite(id) && !(id in consumoParentMap))
    if (bebidaIdsTipo.length === 0 && consumoIds.length === 0 && bebidaIdsConsumo.length === 0) return
    let cancelado = false
    ;(async () => {
      try {
        const supa = (await import("@/lib/supabase/client")).createClient()
        if (bebidaIdsTipo.length > 0) {
          const { data } = await supa.from("menubebidas").select("id, tipomenu").in("id", bebidaIdsTipo)
          if (!cancelado && data) {
            const u: Record<number, string> = {}
            for (const m of data as any[]) u[Number(m.id)] = String(m.tipomenu || "")
            if (Object.keys(u).length > 0) setBebidasTipoMenu(prev => ({ ...prev, ...u }))
          }
        }
        if (bebidaIdsConsumo.length > 0) {
          const { data } = await supa.from("bebidas").select("menubebidaid").in("menubebidaid", bebidaIdsConsumo)
          if (!cancelado) {
            const tiene = new Set((data || []).map((r: any) => Number(r.menubebidaid)))
            const u: Record<number, boolean> = {}
            for (const id of bebidaIdsConsumo) u[id] = tiene.has(id)
            setBebidasConConsumo(prev => ({ ...prev, ...u }))
          }
        }
        if (consumoIds.length > 0) {
          const { data } = await supa.from("bebidas").select("id, menubebidaid").in("id", consumoIds)
          if (!cancelado && data) {
            const u: Record<number, number> = {}
            for (const r of data as any[]) if (r.menubebidaid) u[Number(r.id)] = Number(r.menubebidaid)
            if (Object.keys(u).length > 0) setConsumoParentMap(prev => ({ ...prev, ...u }))
          }
        }
      } catch {}
    })()
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementosPaquete])

  // Sincroniza la columna "Días" de cada renglón del presupuesto con el rango fechaInicial ↔ fechaFinal
  // y recalcula el total en función del nuevo número de días.
  useEffect(() => {
    const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
    setPresupuestoItems(prev => {
      if (prev.length === 0) return prev
      let changed = false
      const next = prev.map(p => {
        if (p.dias === dias) return p
        changed = true
        const cant = p.cantidad || 1
        return { ...p, dias, total: (p.subtotal + (p.servicio || 0)) * cant * (dias || 1) }
      })
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fechaInicial, formData.fechaFinal])

  // Sincroniza tipomenu para cualquier alimento presente en elementosPaquete que aún no esté en el mapa
  // + detecta si el menú tiene platillos asociados en la tabla platillos
  useEffect(() => {
    const alimIds = elementosPaquete
      .filter((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
      .map((el: any) => Number(el.elementoid ?? el.id))
      .filter((id) => Number.isFinite(id))
    const faltantesTipo = alimIds.filter((id) => !(id in alimentosTipoMenu))
    const faltantesPlatillos = alimIds.filter((id) => !(id in alimentosConPlatillos))
    if (faltantesTipo.length === 0 && faltantesPlatillos.length === 0) return
    let cancelado = false
    ;(async () => {
      try {
        const supa = (await import("@/lib/supabase/client")).createClient()
        if (faltantesTipo.length > 0) {
          const { data } = await supa.from("menus").select("id, tipomenu").in("id", faltantesTipo)
          if (!cancelado && data) {
            const update: Record<number, string> = {}
            for (const m of data as any[]) update[Number(m.id)] = String(m.tipomenu || "")
            if (Object.keys(update).length > 0) setAlimentosTipoMenu(prev => ({ ...prev, ...update }))
          }
        }
        if (faltantesPlatillos.length > 0) {
          const { data } = await supa.from("platillos").select("platilloid").in("platilloid", faltantesPlatillos)
          if (!cancelado) {
            const tiene = new Set((data || []).map((r: any) => Number(r.platilloid)))
            const update: Record<number, boolean> = {}
            for (const id of faltantesPlatillos) update[id] = tiene.has(id)
            setAlimentosConPlatillos(prev => ({ ...prev, ...update }))
          }
        }
      } catch {}
    })()
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementosPaquete])

  useEffect(() => {
    loadHoteles()
    loadClientes()
    listaCategoriaEvento().then(r => { if (r.success && r.data) setCategoriasEvento(r.data as { id: number; nombre: string }[]) })
    listaEstatusCotizacion().then(r => {
      if (r.success && r.data) {
        const lista = r.data as ddlItem[]
        setEstatusList(lista)
        // En modo creación, pre-seleccionar "Borrador" via pending state
        if (!effectiveEditId) {
          const borrador = lista.find((e) => e.text.trim().toLowerCase() === "borrador")
          if (borrador) {
            setPendingEstatusId(borrador.value)
          }
        }
      }
    })
  }, [])

  // Aplicar pending estatus cuando la lista esté cargada
  useEffect(() => {
    if (pendingEstatusId && estatusList.length > 0) {
      const match = estatusList.find((e) => e.value === pendingEstatusId)
      if (match) {
        setFormData((prev) => ({ ...prev, estatusId: pendingEstatusId }))
      }
      setPendingEstatusId(null)
    }
  }, [pendingEstatusId, estatusList])

  // Cargar cotización existente si viene editId en URL o como prop
  useEffect(() => {
    const editId = effectiveEditId
    if (!editId) return

    async function cargarCotizacion() {
      setLoadingEdit(true)
      setLoadingEditStep("Cargando cotizacion...")
      const result = await objetoCotizacion(Number(editId))
      if (!result.success || !result.data) { setLoadingEdit(false); return }
      const c = result.data

      const fi   = c.fechainicio?.slice(0, 10) ?? ""
      const ff   = c.fechafin?.slice(0, 10)   ?? ""
      const hi   = c.horainicio?.slice(0, 5)  ?? ""
      const hf   = c.horafin?.slice(0, 5)     ?? ""
      const tid  = c.tipoeventoid?.toString() ?? c.tipoevento?.toString() ?? ""
      const mid  = c.montajeid?.toString()    ?? ""

      // Resolver categoriaevento: vw_oeventos devuelve el nombre (ej: "Social"),
      // pero el Select usa el ID numérico como value
      let categoriaEventoId = ""
      if (c.categoriaevento) {
        const catRes = await listaCategoriaEvento()
        if (catRes.success && catRes.data) {
          setCategoriasEvento(catRes.data as { id: number; nombre: string }[])
          const cat = (catRes.data as { id: number; nombre: string }[]).find(
            (cat) => cat.nombre === c.categoriaevento || cat.id.toString() === c.categoriaevento
          )
          if (cat) categoriaEventoId = cat.id.toString()
        }
      }

      // Setear TODO el formData de una sola vez — sin llamar a ninguna función
      // que use el spread de formData para no pisar los valores
      const salonId = c.salonid?.toString() ?? ""

      setFormData({
        hotel:               c.hotelid?.toString()       ?? "",
        salon:               "",                              // se completa tras loadSalones
        montaje:             "",                              // se completa tras loadMontajes
        fechaInicial:        fi,
        fechaFinal:          ff,
        horaInicio:          hi,
        horaFin:             hf,
        horaPreMontaje:      c.horapremontaje?.slice(0, 5) ?? "",
        horaPostMontaje:     c.horapostmontaje?.slice(0, 5) ?? "",
        horasExtras:         c.horasextras?.toString() ?? "0",
        nombreEvento:        c.nombreevento              ?? "",
        categoriaEvento:     categoriaEventoId,
        tipoEvento:          tid,
        estatusId:           c.estatusid?.toString()     ?? "",
        adultos:             c.numeroinvitados?.toString() ?? "",
        ninos:               "0",
        numeroInvitados:     c.numeroinvitados?.toString() ?? "",
        numeroHabitaciones:  c.numerohabitaciones?.toString() ?? "",
        hospedajeFechaInicio: c.hospedajefechainicio?.slice(0, 10) ?? "",
        hospedajeFechaFin:    c.hospedajefechafin?.slice(0, 10)   ?? "",
        nombreCliente:       c.cliente                  ?? "",
        empresa:             "",
        grupo:               "",
        email:               c.email                    ?? "",
        telefono:            c.telefono                 ?? "",
        subtotal:            c.subtotal?.toString()     ?? "",
        impuestos:           c.impuestos?.toString()    ?? "",
        descuentoPorcentaje: c.porcentajedescuento?.toString() ?? "",
        montoDescuento:      c.montodescuento?.toString() ?? "",
        totalMonto:          c.totalmonto?.toString()   ?? "",
      })

      // Activar checkbox habitaciones si hay datos
      if (c.numerohabitaciones || c.hospedajefechainicio || c.hospedajefechafin) {
        setRequerirHabitaciones(true)
      }

      // Calendario visual
      if (fi && ff) {
        setCalendarRange({
          from: new Date(fi + "T12:00:00"),
          to: new Date(ff + "T12:00:00"),
        })
      }

      // Cargar tipos de evento por categoría — el useEffect de pendingTipoEventoId seteará el valor
      if (categoriaEventoId) {
        if (tid) setPendingTipoEventoId(tid)
        loadTiposEvento(categoriaEventoId)
      }

      // Cargar salones — los useEffects de pendingSalonId y pendingMontajeId setearán los valores
      if (c.hotelid) {
        if (salonId) setPendingSalonId(salonId)
        if (mid) setPendingMontajeId(mid)
        loadSalones(c.hotelid.toString())
      }

      // En modo edición: cargar TODAS las reservaciones del evento y generar un tab por cada una.
      // cotizacionId ahora representa el reservacionid (eventoxreservaciones.id), no el eventoid.
      setLoadingEditStep("Cargando sede y salon...")
      setEventoId(Number(editId))
      const supaCliEdit = (await import("@/lib/supabase/client")).createClient()
      const { data: allResvRows } = await supaCliEdit
        .from("eventoxreservaciones")
        .select("id")
        .eq("eventoid", Number(editId))
        .eq("activo", true)
        .order("id", { ascending: true })
      const reservacionIdActual = allResvRows?.[0]?.id ?? Number(editId)
      if (allResvRows && allResvRows.length > 0) {
        setReservacionTabs(allResvRows.map((r, i) => ({ id: r.id, label: `Reservación ${i + 1}` })))
        setActiveReservacionIdx(0)
      }
      // Baseline de la tab activa tras carga inicial — usar buildSnapshotFromReservacionId
      // para que los valores coincidan exactamente con lo que eventualmente tendrá formData
      // (evita falsos positivos de dirty al cambiar de pestaña antes de resolver pending values).
      try {
        const builtSnap = await buildSnapshotFromReservacionId(reservacionIdActual)
        if (builtSnap) {
          lastSavedTabSnapshotsRef.current[0] = builtSnap
          tabSnapshotsRef.current[0] = builtSnap
        }
      } catch (e) {
        console.error("Error construyendo baseline inicial:", e)
      }
      setCotizacionId(reservacionIdActual)
      setShowPackageSection(true)
      cargarAudiovisualItems(reservacionIdActual)
      cargarComplementoItems(reservacionIdActual)

      // Cargar paquetes del tipo de evento SIN llamar handleTipoEventoChange
      if (tid) {
        setLoadingPaquetes(true)
        const hotelFilter = c.hotelid ? Number(c.hotelid) : undefined
        listaDesplegablePaquetes(Number(tid), hotelFilter).then((res) => {
          const rawList = res.success && res.data ? res.data : []
          const seen = new Set<string>()
          const paquetesList = (rawList as any[]).filter((p: any) => {
            const k = String(p.paqueteid ?? p.id ?? "")
            if (!k || seen.has(k)) return false
            seen.add(k); return true
          })
          setPaquetes(paquetesList)
          setLoadingPaquetes(false)

          // Cargar elementos ya asignados a esta cotización
          setLoadingEditStep("Cargando elementos del paquete...")
          setLoadingElementos(true)
          obtenerPlatillosCotizacion(reservacionIdActual).then((platRes) => {
            if (platRes.success && platRes.data) setPlatillosItems(platRes.data)
          })
          obtenerElementosCotizacion(reservacionIdActual).then((elemRes) => {
            if (elemRes.success && elemRes.data && elemRes.data.length > 0) {
              setElementosPaquete(elemRes.data)
              const paqueteid = elemRes.data[0]?.paqueteid?.toString()
              if (paqueteid) {
                setSelectedPaqueteId(paqueteid)
                const paqueteInfo = paquetesList.find(
                  (p: any) => p.paqueteid?.toString() === paqueteid || p.id?.toString() === paqueteid
                )
                if (paqueteInfo) setSelectedPaqueteInfo(paqueteInfo)
                // Cargar secciones del template del paquete para mantenerlas aunque estén vacías
                obtenerElementosPaquete(Number(paqueteid)).then((tmplRes) => {
                  if (tmplRes.success && tmplRes.data) {
                    const secciones = [...new Set(tmplRes.data.map((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "otros")))]
                    setSeccionesPaquete(secciones as string[])
                  }
                })
              }
            }
            // Construir presupuesto con elementos existentes
            setLoadingEditStep("Calculando presupuesto...")
            if (elemRes.success && elemRes.data) {
              const dias = calcularDiasEvento(fi, ff)
              const numInvitados = Number(c.numeroinvitados) || 0
              const presItems: { concepto: string; tipo: string; precio: number; iva: number; servicio: number; subtotal: number; cantidad: number; dias: number; total: number }[] = []
              // Paquete (reemplaza la agregación por platillo individual)
              ;(async () => {
                const supaCli = (await import("@/lib/supabase/client")).createClient()
                // Fuente principal: eventoxreservaciones.paqueteid (eventoid = editId)
                let paqueteid: string | undefined
                const { data: resRow } = await supaCli
                  .from("eventoxreservaciones")
                  .select("paqueteid")
                  .eq("eventoid", Number(editId))
                  .not("paqueteid", "is", null)
                  .limit(1)
                  .maybeSingle()
                if (resRow?.paqueteid != null) {
                  paqueteid = String(resRow.paqueteid)
                }
                // Fallback: vw_elementocotizacion / elementosxcotizacion
                if (!paqueteid) {
                  for (const el of (elemRes.data || [])) {
                    if (el?.paqueteid != null) { paqueteid = String(el.paqueteid); break }
                  }
                }
                if (!paqueteid) {
                  const { data: rawElems } = await supaCli
                    .from("elementosxcotizacion")
                    .select("paqueteid")
                    .eq("reservacionid", reservacionIdActual)
                    .not("paqueteid", "is", null)
                    .limit(1)
                  if (rawElems && rawElems.length > 0 && rawElems[0].paqueteid != null) {
                    paqueteid = String(rawElems[0].paqueteid)
                  }
                }
                if (paqueteid) {
                  // Cargar platillos ya guardados de esta cotización (con sus datos para conocer tipo y platilloid)
                  const { data: platElems } = await supaCli
                    .from("elementosxcotizacion")
                    .select("elementoid")
                    .eq("reservacionid", reservacionIdActual)
                    .eq("tipoelemento", "Platillo")
                  const platIds = (platElems || []).map((e: any) => Number(e.elementoid)).filter(Boolean)
                  if (platIds.length > 0) {
                    const { data: platillosData } = await supaCli
                      .from("platillos")
                      .select("id, tipo, platilloid")
                      .in("id", platIds)
                    const platillosInfo = platillosData || []
                    // Determinar menú principal por tipomenu="Completo"; si no, el primer alimento con platillos
                    const alimentosEls = (elemRes.data || []).filter((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
                    let menuPrincipal = null as any
                    let menuPrincipalTipo = ""
                    if (alimentosEls.length > 0) {
                      const menuIds = alimentosEls.map((el: any) => Number(el.elementoid ?? el.id))
                      const { data: menusData } = await supaCli.from("menus").select("id, tipomenu").in("id", menuIds)
                      const menuMap = new Map((menusData || []).map((m: any) => [Number(m.id), String(m.tipomenu || "")]))
                      // 1) Completo primero
                      for (const alim of alimentosEls) {
                        const alimId = Number(alim.elementoid ?? alim.id)
                        if ((menuMap.get(alimId) || "").toLowerCase() === "completo") {
                          menuPrincipal = alim
                          menuPrincipalTipo = menuMap.get(alimId) || ""
                          break
                        }
                      }
                      // 2) Fallback: primer alimento con platillos asociados
                      if (!menuPrincipal) {
                        for (const alim of alimentosEls) {
                          const alimId = Number(alim.elementoid ?? alim.id)
                          if (platillosInfo.some((p: any) => Number(p.platilloid) === alimId)) {
                            menuPrincipal = alim
                            menuPrincipalTipo = menuMap.get(alimId) || ""
                            break
                          }
                        }
                      }
                    }
                    if (menuPrincipal) {
                      const menuPrincipalId = Number(menuPrincipal.elementoid ?? menuPrincipal.id)
                      // Platillo clave: Plato Fuerte (Completo) o primero (Individual/otros)
                      const esCompleto = menuPrincipalTipo.toLowerCase() === "completo"
                      const platillosDeEseMenu = platillosInfo.filter((p: any) => Number(p.platilloid) === menuPrincipalId)
                      const platilloClave = esCompleto
                        ? platillosDeEseMenu.find((p: any) => (p.tipo || "").toUpperCase() === "PLATO FUERTE")
                        : platillosDeEseMenu[0]
                      if (platilloClave) {
                        const { data: paqRow } = await supaCli
                          .from("paquetes")
                          .select("id, nombre, precioporpersona")
                          .eq("id", Number(paqueteid))
                          .maybeSingle()
                        let precioPaquete = Number(paqRow?.precioporpersona ?? 0) || 0
                        if (precioPaquete === 0) {
                          const res = await obtenerPrecioPaquetePorPlatillo(Number(paqueteid), Number(platilloClave.id))
                          precioPaquete = res.precio || 0
                        }
                        const nombreMenu = menuPrincipal?.descripcion || menuPrincipal?.nombre || menuPrincipal?.elemento || paqRow?.nombre || "Paquete"
                        presItems.push(crearPresupuestoItem(nombreMenu, "Paquete", precioPaquete, dias, 0, numInvitados))
                      }
                    }
                  }
                }
                // Audiovisual
                const { data: avElems } = await supaCli.from("elementosxcotizacion").select("*").eq("reservacionid", reservacionIdActual).eq("tipoelemento", "AudioVisual")
                if (avElems && avElems.length > 0) {
                  const avIds = avElems.map((e: any) => e.elementoid)
                  const { data: avData } = await supaCli.from("audiovisual").select("id, nombre, costo").in("id", avIds)
                  const avMap = new Map((avData || []).map((a: any) => [a.id, a]))
                  for (const e of avElems) {
                    const av = avMap.get(e.elementoid)
                    const avTotal = av?.costo ? Number(av.costo) : 0
                    presItems.push(crearPresupuestoItem(av?.nombre || "Audiovisual", "Audiovisual", avTotal, dias, 0, 1))
                  }
                }
                // Complementos
                const { data: compElems } = await supaCli.from("elementosxcotizacion").select("*").eq("reservacionid", reservacionIdActual).eq("tipoelemento", "Complemento")
                if (compElems && compElems.length > 0) {
                  const compIds = compElems.map((e: any) => e.elementoid)
                  const { data: compData } = await supaCli.from("complementos").select("id, nombre, costo").in("id", compIds)
                  const compMap = new Map((compData || []).map((c: any) => [c.id, c]))
                  for (const e of compElems) {
                    const comp = compMap.get(e.elementoid)
                    const compTotal = comp?.costo ? Number(comp.costo) : 0
                    presItems.push(crearPresupuestoItem(comp?.nombre || "Complemento", "Complemento", compTotal, dias, 0, numInvitados))
                  }
                }
                // Agregar salón al inicio
                if (salonId) {
                  objetoSalon(Number(salonId)).then((salonRes) => {
                    if (salonRes.success && salonRes.data) {
                      const precioSalon = salonRes.data.preciopordia ? Number(salonRes.data.preciopordia) : 0
                      presItems.unshift(crearPresupuestoItem(salonRes.data.nombre || "Salón", "Salón", precioSalon, dias, 0, 1))
                    }
                    setPresupuestoItems(presItems)
                    setLoadingEdit(false)
                  })
                } else {
                  setPresupuestoItems(presItems)
                  setLoadingEdit(false)
                }
              })()
            }
            setLoadingElementos(false)
            if (!(elemRes.success && elemRes.data && elemRes.data.length > 0)) {
              setLoadingEdit(false)
            }
          })
        })
      } else {
        setLoadingEdit(false)
      }

      if (c.clienteid) {
        setSelectedClienteId(c.clienteid.toString())
        const cid = Number(c.clienteid)
        Promise.all([obtenerEmpresaPorCliente(cid), obtenerGrupoEmpresa(cid)]).then(([empresaRes, grupoRes]) => {
          setFormData(prev => ({
            ...prev,
            empresa: empresaRes.success ? empresaRes.nombre : "",
            grupo: grupoRes.success ? grupoRes.nombre : "",
          }))
        })
      }
    }

    cargarCotizacion()
  }, [effectiveEditId])

  useEffect(() => {
    if (hasLoadedFromParams) return

    const hotelId = searchParams.get("hotelId")
    const salonId = searchParams.get("salonId")
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")

    if (hotelId) {
      setPendingHotelId(hotelId)

      if (salonId) {
        setPendingSalonId(salonId)
      }

      setHasLoadedFromParams(true)
    }

    if (fechaInicio) {
      setFormData((prev) => ({
        ...prev,
        fechaInicial: fechaInicio,
        fechaFinal: fechaFin || fechaInicio,
      }))
      // Sincronizar el calendario visual
      const from = new Date(fechaInicio + "T12:00:00")
      const to = new Date((fechaFin || fechaInicio) + "T12:00:00")
      setCalendarRange({ from, to })
    }
  }, [searchParams, hasLoadedFromParams])

  useEffect(() => {
    if (pendingHotelId && hoteles.length > 0) {
      console.log("[v0] Hoteles loaded, setting hotel:", pendingHotelId)
      const hotelExists = hoteles.find((h) => h.value === pendingHotelId)
      if (hotelExists) {
        setFormData((prev) => ({ ...prev, hotel: pendingHotelId }))
        loadSalones(pendingHotelId)
        setPendingHotelId(null)
      }
    }
  }, [hoteles, pendingHotelId])

  useEffect(() => {
    if (pendingSalonId && salones.length > 0) {
      const salonExists = salones.find((s) => s.value === pendingSalonId)
      if (salonExists) {
        setFormData((prev) => ({ ...prev, salon: pendingSalonId }))
        loadMontajes(pendingSalonId)
        setPendingSalonId(null)
      }
    }
  }, [salones, pendingSalonId])

  useEffect(() => {
    if (pendingMontajeId && montajes.length > 0) {
      const montajeExists = montajes.find((m) => m.value === pendingMontajeId)
      if (montajeExists) {
        setFormData((prev) => ({ ...prev, montaje: pendingMontajeId }))
        setPendingMontajeId(null)
      }
    }
  }, [montajes, pendingMontajeId])

  useEffect(() => {
    if (pendingTipoEventoId && tiposEvento.length > 0) {
      const tipoExists = tiposEvento.find((t) => t.value === pendingTipoEventoId)
      if (tipoExists) {
        setFormData((prev) => ({ ...prev, tipoEvento: pendingTipoEventoId }))
        setPendingTipoEventoId(null)
      }
    }
  }, [tiposEvento, pendingTipoEventoId])

  async function loadTiposEvento(categoriaevento = "") {
    const result = await listaDesplegableTipoEvento(categoriaevento)
    if (result.success && result.data) {
      setTiposEvento(result.data)
    } else {
      setTiposEvento([])
    }
  }

  async function handleTipoEventoChange(tipoeventoid: string) {
    setFormData(prev => ({ ...prev, tipoEvento: tipoeventoid }))
    setSelectedPaqueteId("")
    setSelectedPaqueteInfo(null)
    setElementosPaquete([])
    setPaquetes([])

    if (tipoeventoid) {
      setLoadingPaquetes(true)
      const hotelId = formData.hotel ? Number(formData.hotel) : undefined
      const result = await listaDesplegablePaquetes(Number(tipoeventoid), hotelId)
      if (result.success && result.data) {
        // Dedup por paqueteid/id para evitar keys duplicadas en Select
        const seen = new Set<string>()
        const unique = (result.data as any[]).filter((p: any) => {
          const k = String(p.paqueteid ?? p.id ?? "")
          if (!k || seen.has(k)) return false
          seen.add(k); return true
        })
        setPaquetes(unique)
      }
      setLoadingPaquetes(false)
    }
  }

  async function handlePaqueteChange(paqueteid: string) {
    setPreviewPaqueteId(paqueteid)
    setPreviewPaqueteInfo(null)
    setElementosPreviewPaquete([])
    if (paqueteid) {
      const paquete = paquetes.find((p) => p.paqueteid?.toString() === paqueteid || p.id?.toString() === paqueteid)
      setPreviewPaqueteInfo(paquete || null)
      setLoadingPreviewPaquete(true)
      const res = await obtenerElementosPaquete(Number(paqueteid))
      if (res.success && res.data) setElementosPreviewPaquete(res.data)
      setLoadingPreviewPaquete(false)
    }
  }

  async function handleLimpiarPaquete() {
    if (!cotizacionId) return
    setLimpiarLoading(true)
    const result = await limpiarElementosCotizacion(cotizacionId)
    if (result.success) {
      setElementosPaquete([])
      setPlatillosItems([])
      setSelectedPaqueteId("")
      setSelectedPaqueteInfo(null)
      // Quitar renglón "Paquete" del presupuesto al desasociar
      setPresupuestoItems(prev => prev.filter(p => p.tipo !== "Paquete"))
      // Limpiar paqueteid en eventoxreservaciones
      try {
        const supa = (await import("@/lib/supabase/client")).createClient()
        await supa.from("eventoxreservaciones").update({ paqueteid: null }).eq("id", cotizacionId)
      } catch {}
      setShowLimpiarModal(false)
    } else {
      alert(`Error al limpiar paquete: ${result.error}`)
    }
    setLimpiarLoading(false)
  }

  async function handleEliminarElemento(tipoelemento: string, id: number) {
    if (!cotizacionId) return
    const result = await eliminarElementoCotizacion(cotizacionId, tipoelemento, id)
    if (result.success) {
      // Si se elimina un Alimento, también eliminar todos los Platillos de esta cotización
      if (tipoelemento === "Alimento") {
        for (const platillo of platillosItems) {
          await eliminarElementoCotizacion(cotizacionId, "Platillo", Number(platillo.elementoid ?? platillo.id))
        }
      }
      const [elementosResult, platRes] = await Promise.all([
        obtenerElementosCotizacion(cotizacionId),
        obtenerPlatillosCotizacion(cotizacionId),
      ])
      if (elementosResult.success && elementosResult.data) setElementosPaquete(elementosResult.data)
      const platsFresh = (platRes.success && platRes.data) ? platRes.data : []
      const elemsFresh = (elementosResult.success && elementosResult.data) ? elementosResult.data : []
      if (platRes.success && platRes.data) setPlatillosItems(platRes.data)
      // Recalcular renglón "Paquete" (se quita si ya no quedan platillos en el menú principal)
      if (tipoelemento === "Alimento" || tipoelemento === "Platillo") {
        await recalcularPresupuestoPaquete(platsFresh, elemsFresh)
      }
      // Remover del presupuesto: si se elimina Alimento, quitar sus Platillos
      if (tipoelemento === "Alimento") {
        setPresupuestoItems(prev => prev.filter(p => p.tipo !== "Platillo"))
      } else if (tipoelemento === "Platillo") {
        // Remover solo el platillo eliminado (por nombre, ya que puede haber varios)
        const elementoEliminado = [...elementosPaquete, ...platillosItems].find(
          el => Number(el.elementoid ?? el.id) === id
        )
        if (elementoEliminado) {
          const nombreEl = elementoEliminado.descripcion || elementoEliminado.nombre || elementoEliminado.elemento || ""
          setPresupuestoItems(prev => {
            const idx = prev.findIndex(p => p.tipo === "Platillo" && p.concepto === nombreEl)
            if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
            return prev
          })
        }
      }
    } else {
      alert(`Error al eliminar: ${result.error}`)
    }
  }

  async function loadAudiovisualPreview(id: number) {
    setPreviewAudiovisualId(id)
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient()
      const { data } = await supabase.from("audiovisual").select("imgurl").eq("id", id).maybeSingle()
      setAvPdfUrl(data?.imgurl || "")
    } catch { setAvPdfUrl("") }
  }

  async function handleAbrirAudiovisual() {
    setShowAudiovisualModal(true)
    setSelectedAudiovisualId("")
    setSelectedAudiovisualIds(new Set())
    setAudiovisualSearch("")
    setPreviewAudiovisualId(null)
    setAvPdfUrl("")
    setLoadingAudiovisual(true)
    const supabase = (await import("@/lib/supabase/client")).createClient()
    const { data } = await supabase.from("audiovisual").select("*").eq("hotelid", Number(formData.hotel)).eq("activo", true).order("nombre")
    if (data) {
      const yaAsignados = new Set(audiovisualItems.map((el: any) => Number(el.elementoid)))
      setAudiovisualTabla(data.filter((el: any) => !yaAsignados.has(Number(el.id))))
    }
    setLoadingAudiovisual(false)
  }

  async function handleAgregarAudiovisual() {
    if (!cotizacionId) return
    const ids = Array.from(selectedAudiovisualIds)
    if (ids.length === 0) return
    setSavingAudiovisual(true)
    const supabase = (await import("@/lib/supabase/client")).createClient()
    const rows = ids.map(id => ({
      reservacionid: cotizacionId,
      tipoelemento: "AudioVisual",
      elementoid: id,
      hotelid: Number(formData.hotel),
    }))
    const { error } = await supabase.from("elementosxcotizacion").insert(rows)
    if (!error) {
      await cargarAudiovisualItems(cotizacionId)
      const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
      const nuevos = ids.map(id => {
        const av = audiovisualTabla.find((el: any) => Number(el.id) === id)
        if (!av) return null
        const avTotal = av.costo ? Number(av.costo) : 0
        return crearPresupuestoItem(av.nombre || "Audiovisual", "Audiovisual", avTotal, dias, 0, 1)
      }).filter(Boolean) as any[]
      if (nuevos.length > 0) setPresupuestoItems(prev => [...prev, ...nuevos])
      setShowAudiovisualModal(false)
      setSelectedAudiovisualId("")
      setSelectedAudiovisualIds(new Set())
      setPreviewAudiovisualId(null)
      setAvPdfUrl("")
      setAudiovisualSearch("")
    } else {
      alert(`Error al agregar audiovisual: ${error.message}`)
    }
    setSavingAudiovisual(false)
  }

  async function handleEliminarAudiovisual(elementoid: number) {
    if (!cotizacionId) return
    // Obtener nombre antes de eliminar para remover del presupuesto
    const avItem = audiovisualItems.find((el: any) => Number(el.audiovisual?.id || el.elementoid) === elementoid)
    const nombreAv = avItem?.audiovisual?.nombre || ""
    const supabase = (await import("@/lib/supabase/client")).createClient()
    await supabase.from("elementosxcotizacion").delete().eq("reservacionid", cotizacionId).eq("tipoelemento", "AudioVisual").eq("elementoid", elementoid)
    await cargarAudiovisualItems(cotizacionId)
    // Remover del presupuesto
    if (nombreAv) {
      setPresupuestoItems(prev => {
        const idx = prev.findIndex(p => p.tipo === "Audiovisual" && p.concepto === nombreAv)
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    }
  }

  async function cargarAudiovisualItems(cotId: number) {
    const supabase = (await import("@/lib/supabase/client")).createClient()
    const { data: elems } = await supabase.from("elementosxcotizacion").select("*").eq("reservacionid", cotId).eq("tipoelemento", "AudioVisual")
    if (elems && elems.length > 0) {
      const ids = elems.map((e: any) => e.elementoid)
      const { data: avData } = await supabase.from("audiovisual").select("*").in("id", ids)
      const avMap = new Map((avData || []).map((a: any) => [a.id, a]))
      setAudiovisualItems(elems.map((e: any) => ({ ...e, audiovisual: avMap.get(e.elementoid) || null })))
    } else {
      setAudiovisualItems([])
    }
  }

  async function handleAbrirComplemento() {
    setShowComplementoModal(true)
    setSelectedComplementoId("")
    setCompPdfUrl("")
    setLoadingComplemento(true)
    const supabase = (await import("@/lib/supabase/client")).createClient()
    // Listar complementos del hotel seleccionado (sin filtrar por platillo/alimento)
    const { data } = await supabase
      .from("complementos")
      .select("id, nombre, costo")
      .eq("hotelid", Number(formData.hotel))
      .eq("activo", true)
      .order("nombre")
    if (data) {
      const yaAsignados = new Set(complementoItems.map((el: any) => Number(el.elementoid)))
      setComplementoTabla(data.filter((el: any) => !yaAsignados.has(Number(el.id))))
    }
    setLoadingComplemento(false)
  }

  async function handleAgregarComplemento() {
    if (!cotizacionId) return
    const ids = Array.from(selectedComplementoIds)
    if (ids.length === 0) return
    setSavingComplemento(true)
    const supabase = (await import("@/lib/supabase/client")).createClient()
    const rows = ids.map(id => ({
      reservacionid: cotizacionId,
      tipoelemento: "Complemento",
      elementoid: id,
      hotelid: Number(formData.hotel),
    }))
    const { error } = await supabase.from("elementosxcotizacion").insert(rows)
    if (!error) {
      await cargarComplementoItems(cotizacionId)
      // Agregar al presupuesto
      const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
      const numInvitados = Number(formData.numeroInvitados) || 0
      const nuevos = ids.map(id => {
        const comp = complementoTabla.find((el: any) => Number(el.id) === id)
        if (!comp) return null
        const compTotal = comp.costo ? Number(comp.costo) : 0
        return crearPresupuestoItem(comp.nombre || "Complemento", "Complemento", compTotal, dias, 0, numInvitados)
      }).filter(Boolean) as any[]
      if (nuevos.length > 0) {
        setPresupuestoItems(prev => [...prev, ...nuevos])
      }
      setShowComplementoModal(false)
      setSelectedComplementoId("")
      setSelectedComplementoIds(new Set())
      setPreviewComplementoId(null)
      setCompPdfUrl("")
      setComplementoSearch("")
    } else {
      alert(`Error al agregar complementos: ${error.message}`)
    }
    setSavingComplemento(false)
  }

  async function loadComplementoPreview(complementoId: number) {
    setPreviewComplementoId(complementoId)
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient()
      const { data } = await supabase.from("complementos").select("imgurl").eq("id", complementoId).maybeSingle()
      setCompPdfUrl(data?.imgurl || "")
    } catch { setCompPdfUrl("") }
  }

  async function handleEliminarComplemento(elementoid: number) {
    if (!cotizacionId) return
    // Obtener nombre antes de eliminar para remover del presupuesto
    const compItem = complementoItems.find((el: any) => Number(el.complemento?.id || el.elementoid) === elementoid)
    const nombreComp = compItem?.complemento?.nombre || ""
    const supabase = (await import("@/lib/supabase/client")).createClient()
    await supabase.from("elementosxcotizacion").delete().eq("reservacionid", cotizacionId).eq("tipoelemento", "Complemento").eq("elementoid", elementoid)
    await cargarComplementoItems(cotizacionId)
    // Remover del presupuesto
    if (nombreComp) {
      setPresupuestoItems(prev => {
        const idx = prev.findIndex(p => p.tipo === "Complemento" && p.concepto === nombreComp)
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    }
  }

  async function cargarComplementoItems(cotId: number) {
    const supabase = (await import("@/lib/supabase/client")).createClient()
    const { data: elems } = await supabase.from("elementosxcotizacion").select("*").eq("reservacionid", cotId).eq("tipoelemento", "Complemento")
    if (elems && elems.length > 0) {
      const ids = elems.map((e: any) => e.elementoid)
      const { data: compData } = await supabase.from("complementos").select("id, nombre, costo").in("id", ids)
      const compMap = new Map((compData || []).map((c: any) => [c.id, c]))
      setComplementoItems(elems.map((e: any) => ({ ...e, complemento: compMap.get(e.elementoid) || null })))
    } else {
      setComplementoItems([])
    }
  }

  async function handleVerPDF(elementoid: number, tipo: string) {
    setShowPDFModal(true)
    setPdfModalUrl("")
    setLoadingPDF(true)
    const result = await obtenerDocumentoPDF(elementoid, tipo)
    if (result.success && result.pdf) setPdfModalUrl(result.pdf)
    setLoadingPDF(false)
  }

  async function handleGenerarPDF() {
    if (!formData.hotel) {
      alert("Seleccione un hotel antes de generar el PDF.")
      return
    }
    setGeneratingPDF(true)
    try {
      // Obtener formato de cotización del hotel y datos del usuario en paralelo
      const [formatoRes, usuarioRes] = await Promise.all([
        obtenerFormatoCotizacion(Number(formData.hotel)),
        obtenerUsuarioSesionActual(),
      ])
      if (!formatoRes.success || !formatoRes.data) {
        alert("No se encontró formato de cotización para este hotel.")
        setGeneratingPDF(false)
        return
      }
      const formato = formatoRes.data
      const usuarioData = usuarioRes.success && usuarioRes.data ? usuarioRes.data : null

      const empresaCliente = formData.empresa

      // tipoEvento es a nivel de evento (compartido entre reservaciones)
      const tipoEventoNombre = tiposEvento.find(t => t.value === formData.tipoEvento)?.text || ""

      // Complementos y Audiovisual son por hotel (compartidos)
      const [complementosRes, audiovisualRes] = await Promise.all([
        obtenerComplementosPorHotel(Number(formData.hotel)),
        obtenerAudiovisualPorHotel(Number(formData.hotel)),
      ])
      const complementosData = complementosRes.success ? complementosRes.data : []
      const audiovisualData = audiovisualRes.success ? audiovisualRes.data : []

      // Helpers de formato (se usan dentro del loop por reservación)
      const formatearFecha = (fecha: string) => {
        if (!fecha) return ""
        const d = new Date(fecha + "T12:00:00")
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]} del ${d.getFullYear()}`
      }
      const formatearHora = (hora: string) => {
        if (!hora) return ""
        return `${hora} hrs.`
      }

      // Armar snapshots de cada reservación del evento (activa usa estado actual; otras: snapshot en memoria o DB)
      tabSnapshotsRef.current[activeReservacionIdx] = captureCurrentTabSnapshot()
      const tabSnaps: any[] = []
      if (reservacionTabs.length > 0) {
        for (let i = 0; i < reservacionTabs.length; i++) {
          let s = tabSnapshotsRef.current[i]
          if (!s) {
            const tab = reservacionTabs[i]
            if (tab?.id) {
              try { s = await buildSnapshotFromReservacionId(tab.id) } catch { s = null }
            }
          }
          if (s) tabSnaps.push(s)
        }
      }
      if (tabSnaps.length === 0) tabSnaps.push(captureCurrentTabSnapshot())

      // Pre-fetch datos específicos por reservación (salón + platillo clave) en paralelo
      const salonInfoArr: any[] = new Array(tabSnaps.length).fill(null)
      const platilloArr: any[] = new Array(tabSnaps.length).fill(null)
      await Promise.all(tabSnaps.map(async (s, i) => {
        if (s?.formData?.salon) {
          const r = await objetoSalon(Number(s.formData.salon))
          if (r.success && r.data) salonInfoArr[i] = r.data
        }
        const plats = s?.platillosItems || []
        if (plats.length > 0) {
          const pid = Number(plats[0].elementoid ?? plats[0].id)
          const r = await obtenerPlatilloItemPorId(pid)
          if (r.success && r.data) platilloArr[i] = r.data as any
        }
      }))

      // Fecha actual para encabezado
      const hoy = new Date()
      const mesesCorto = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
      const fechaHoy = `Monterrey, Nuevo León, a ${hoy.getDate()} de ${mesesCorto[hoy.getMonth()]} del ${hoy.getFullYear()}`

      // Generar PDF con jsPDF
      const { default: jsPDF } = await import("jspdf")
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginLeft = 20
      const contentWidth = pageWidth - marginLeft - 20
      const headerHeight = 50
      let y = 0

      // Pre-cargar imágenes de encabezado y footer
      let imgHeaderBase64: string | null = null
      let imgFooterBase64: string | null = null
      if (formato.imgencabezado) {
        try { imgHeaderBase64 = await loadImageAsBase64(formato.imgencabezado) } catch { /* sin header */ }
      }
      if (formato.imgfooter) {
        try { imgFooterBase64 = await loadImageAsBase64(formato.imgfooter) } catch { /* sin footer */ }
      }

      // Calcular altura del footer proporcionalmente a la imagen
      let footerHeight = 30 // fallback mínimo si no hay imagen
      if (imgFooterBase64) {
        try {
          const dims = await getImageDimensions(imgFooterBase64)
          footerHeight = (dims.height / dims.width) * pageWidth
        } catch {
          footerHeight = 30
        }
      }

      // Zona segura de contenido (entre encabezado y footer)
      const contentTopY = imgHeaderBase64 ? headerHeight : 20
      const contentBottomY = pageHeight - footerHeight - 5

      // Helper: pintar encabezado en la página actual
      function pintarEncabezado() {
        if (imgHeaderBase64) {
          doc.addImage(imgHeaderBase64, "PNG", 0, 0, pageWidth, 40)
        }
      }

      // Helper: pintar footer en la página actual
      function pintarFooter() {
        const footerY = pageHeight - footerHeight
        if (imgFooterBase64) {
          doc.addImage(imgFooterBase64, "PNG", 0, footerY, pageWidth, footerHeight)
        }
        if (usuarioData) {
          const userY = footerY + 8
          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(255, 255, 255)
          const nombrePuesto = [usuarioData.nombrecompleto, usuarioData.puesto].filter(Boolean).join("  |  ")
          doc.text(nombrePuesto, marginLeft, userY)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)
          const contactoLinea = [
            usuarioData.telefono ? `Tel: ${usuarioData.telefono}` : "",
            usuarioData.email || "",
          ].filter(Boolean).join("  |  ")
          doc.text(contactoLinea, marginLeft, userY + 5)
        }
      }

      // Helper: verificar si cabe contenido, si no crear nueva página
      function checkNewPage(needed: number): void {
        if (y + needed > contentBottomY) {
          pintarFooter()
          doc.addPage()
          pintarEncabezado()
          y = contentTopY
        }
      }

      // ====== PÁGINA 1 ======
      pintarEncabezado()
      y = contentTopY

      // --- Título "Cotización" ---
      doc.setFont("helvetica", "bold")
      doc.setFontSize(22)
      doc.setTextColor(50, 50, 50)
      doc.text("Cotización", pageWidth / 2, y, { align: "center" })
      y += 6

      // Línea decorativa bajo título
      doc.setDrawColor(50, 50, 50)
      doc.setLineWidth(0.5)
      const tituloWidth = doc.getTextWidth("Cotización")
      doc.line((pageWidth - tituloWidth) / 2, y, (pageWidth + tituloWidth) / 2, y)
      y += 12

      // --- Fecha actual (alineada a la derecha) ---
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text(fechaHoy, pageWidth - 20, y, { align: "right" })
      y += 14

      // --- Datos del cliente ---
      doc.setFontSize(10)
      const clienteFields = [
        { label: "Nombre:", value: formData.nombreCliente },
        { label: "Empresa:", value: empresaCliente },
        { label: "Teléfono:", value: formData.telefono },
        { label: "Email:", value: formData.email },
      ]
      for (const field of clienteFields) {
        checkNewPage(6)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(50, 50, 50)
        doc.text(field.label, marginLeft, y)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(40, 40, 40)
        doc.text(field.value || "", marginLeft + 22, y)
        y += 5.5
      }
      y += 8

      // --- Información preferencial ---
      if (formato.informacionpreferencial) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9.5)
        doc.setTextColor(40, 40, 40)
        const infoLines = doc.splitTextToSize(formato.informacionpreferencial, contentWidth)
        const infoHeight = infoLines.length * 4.5 + 8
        checkNewPage(infoHeight)
        doc.text(infoLines, marginLeft, y)
        y += infoHeight
      }

      // ======== LOOP POR RESERVACIÓN ========
      for (let tabIdx = 0; tabIdx < tabSnaps.length; tabIdx++) {
        const snap = tabSnaps[tabIdx]
        if (!snap) continue
        const fd = snap.formData || {}
        const presupuestoItems = snap.presupuestoItems || []
        const elementosPaquete = snap.elementosPaquete || []
        const platillosItems = snap.platillosItems || []
        const platilloData = platilloArr[tabIdx]
        const salonInfo = salonInfoArr[tabIdx]
        const salonNombre = salonInfo?.nombre || ""
        const montajeNombre = salonInfo?.montajes?.find((m: any) => String(m.id) === String(fd.montaje))?.montaje || ""
        const salonPres = presupuestoItems.find((p: any) => p.tipo === "Salón")
        const rentaSalon = salonPres ? `$${salonPres.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "$0.00"
        const fechaTexto = fd.fechaFinal && fd.fechaFinal !== fd.fechaInicial
          ? `${formatearFecha(fd.fechaInicial)} al ${formatearFecha(fd.fechaFinal)}`
          : formatearFecha(fd.fechaInicial || "")
        const horarioTexto = `${formatearHora(fd.horaInicio)} a ${formatearHora(fd.horaFin)}`

        // Separador + título entre reservaciones
        if (tabIdx > 0) {
          y += 10
          checkNewPage(30)
        }
        if (tabSnaps.length > 1) {
          checkNewPage(14)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(13)
          doc.setTextColor(50, 50, 50)
          const resvLabel = `Reservación ${tabIdx + 1}${fd.nombreEvento ? ` — ${fd.nombreEvento}` : ""}`
          doc.text(resvLabel, marginLeft, y)
          y += 2
          doc.setDrawColor(50, 50, 50)
          doc.setLineWidth(0.4)
          const resvW = doc.getTextWidth(resvLabel)
          doc.line(marginLeft, y + 1, marginLeft + resvW, y + 1)
          y += 7
        }

      // --- Tabla de evento ---
      const tableData = [
        { label: "Fecha:", value: `${fechaTexto}\n(Sujeto a disponibilidad)` },
        { label: "Evento:", value: tipoEventoNombre },
        { label: "Salón:", value: `${salonNombre}\n(Los espacios no han sido reservados) espacios sujetos a disponibilidad, Para garantizar el servicio se requiere la firma de contrato y pago por concepto de anticipo.` },
        { label: "Garantía:", value: `${fd.numeroInvitados} personas` },
        { label: "Renta:", value: `${rentaSalon} incluyendo el 16% de I.V.A\nLa renta del salón será en cortesía por el consumo equivalente a la renta de salón en alimentos y bebidas programadas en banquetes.` },
        { label: "Horario:", value: horarioTexto },
        { label: "Montaje:", value: montajeNombre },
      ]

      const colLabelWidth = 35
      const colValueWidth = contentWidth - colLabelWidth
      const tableX = marginLeft

      // Borde superior de la tabla
      checkNewPage(10)
      doc.setDrawColor(160, 160, 160)
      doc.setLineWidth(0.3)
      doc.line(tableX, y, tableX + contentWidth, y)

      for (const row of tableData) {
        doc.setFontSize(9.5)
        const valueLines = doc.splitTextToSize(row.value || "", colValueWidth - 6)
        const rowHeight = Math.max(valueLines.length * 4.5 + 4, 8)

        checkNewPage(rowHeight)
        // Borde superior si es inicio de nueva página
        if (y === contentTopY) {
          doc.setDrawColor(160, 160, 160)
          doc.setLineWidth(0.3)
          doc.line(tableX, y, tableX + contentWidth, y)
        }

        doc.setDrawColor(160, 160, 160)
        doc.setLineWidth(0.3)
        doc.line(tableX, y, tableX, y + rowHeight)
        doc.line(tableX + colLabelWidth, y, tableX + colLabelWidth, y + rowHeight)
        doc.line(tableX + contentWidth, y, tableX + contentWidth, y + rowHeight)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(9.5)
        doc.setTextColor(50, 50, 50)
        doc.text(row.label, tableX + 3, y + 5.5)

        doc.setFont("helvetica", "normal")
        doc.setTextColor(40, 40, 40)
        doc.text(valueLines, tableX + colLabelWidth + 3, y + 5.5)

        y += rowHeight
        doc.line(tableX, y, tableX + contentWidth, y)
      }

      // --- Fila de Servicio (platillo + complementos) con soporte multi-página ---
      if (platilloData) {
        const valueX = tableX + colLabelWidth + 3
        const maxValueWidth = colValueWidth - 6

        // Recopilar bloques de contenido para la fila de Servicio
        type PdfBlock = { type: "text"; font: string; size: number; color: [number, number, number]; text: string; lineHeight: number; extraSpacing?: number }
        const blocks: PdfBlock[] = []

        // Nombre del alimento + horas del platillo (de la sección Alimentos, fuente más grande)
        const alimentoEl = elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
        const alimentoNombre = alimentoEl ? (alimentoEl.descripcion || alimentoEl.nombre || alimentoEl.elemento || "") : ""
        const horasPlatillo = (platilloData as any).horas
        const horasTxt = horasPlatillo ? ` (${horasPlatillo} horas)` : ""
        if (alimentoNombre) {
          blocks.push({ type: "text", font: "bold", size: 12, color: [40, 40, 40], text: `${alimentoNombre}${horasTxt}`, lineHeight: 5.5, extraSpacing: 4 })
        }

        // Nombre del platillo
        blocks.push({ type: "text", font: "bold", size: 10, color: [40, 40, 40], text: platilloData.nombre || "", lineHeight: 4.5, extraSpacing: 2 })

        // Descripción del platillo
        if (platilloData.descripcion) {
          blocks.push({ type: "text", font: "normal", size: 9, color: [60, 60, 60], text: platilloData.descripcion, lineHeight: 4, extraSpacing: 4 })
        }

        // Precio por persona
        const precioTexto = `Precio por persona $${platilloData.costo?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) || "0.00"}`
        blocks.push({ type: "text", font: "bold", size: 9.5, color: [50, 50, 50], text: precioTexto, lineHeight: 4.5, extraSpacing: 1 })
        blocks.push({ type: "text", font: "bold", size: 9.5, color: [50, 50, 50], text: "Incluye 16% IVA y 15% de servicio.", lineHeight: 4.5, extraSpacing: 7 })

        // Complementos
        if (complementosData.length > 0) {
          blocks.push({ type: "text", font: "bold", size: 9.5, color: [40, 40, 40], text: "COMPLEMENTOS:", lineHeight: 4.5, extraSpacing: 2 })

          for (const comp of complementosData) {
            const cantUnidad = comp.cantidad && comp.unidad ? ` (${comp.cantidad} ${comp.unidad})` : comp.cantidad ? ` (${comp.cantidad})` : ""
            blocks.push({ type: "text", font: "normal", size: 9, color: [40, 40, 40], text: `•  ${comp.nombre || ""}${cantUnidad}`, lineHeight: 4, extraSpacing: 0 })
            if (comp.descripcion) {
              blocks.push({ type: "text", font: "normal", size: 8.5, color: [80, 80, 80], text: `   ${comp.descripcion}`, lineHeight: 3.5, extraSpacing: 0 })
            }
            if (comp.costo) {
              blocks.push({ type: "text", font: "bold", size: 9, color: [50, 50, 50], text: `   Promoción $${comp.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, lineHeight: 4, extraSpacing: 1 })
            }
          }

          // Pie de complementos
          blocks.push({ type: "text", font: "bold", size: 9.5, color: [50, 50, 50], text: "Precio por persona", lineHeight: 4.5, extraSpacing: 1 })
          blocks.push({ type: "text", font: "bold", size: 9.5, color: [50, 50, 50], text: "Incluye 16% IVA y 15% de servicio.", lineHeight: 4.5, extraSpacing: 3 })
        }

        // Renderizar bloques con paginación — dentro de celdas con bordes
        let servicioLabelDrawn = false
        let cellStartY = y

        // Borde superior de fila Servicio
        if (y === contentTopY) {
          doc.setDrawColor(160, 160, 160)
          doc.setLineWidth(0.3)
          doc.line(tableX, y, tableX + contentWidth, y)
        }
        cellStartY = y
        let cursorY = y + 5.5

        function closeCellBorders() {
          doc.setDrawColor(160, 160, 160)
          doc.setLineWidth(0.3)
          doc.line(tableX, cellStartY, tableX, y)
          doc.line(tableX + colLabelWidth, cellStartY, tableX + colLabelWidth, y)
          doc.line(tableX + contentWidth, cellStartY, tableX + contentWidth, y)
        }

        for (const block of blocks) {
          doc.setFont("helvetica", block.font)
          doc.setFontSize(block.size)
          const lines = doc.splitTextToSize(block.text, maxValueWidth)
          const blockHeight = lines.length * block.lineHeight + (block.extraSpacing || 0)

          // ¿Cabe en la página actual?
          if (cursorY + blockHeight > contentBottomY) {
            // Cerrar celda hasta el fondo de la zona segura
            y = contentBottomY
            closeCellBorders()
            doc.line(tableX, y, tableX + contentWidth, y)

            pintarFooter()
            doc.addPage()
            pintarEncabezado()
            y = contentTopY
            cellStartY = y
            cursorY = y + 5.5
            servicioLabelDrawn = false

            // Borde superior en nueva página
            doc.setDrawColor(160, 160, 160)
            doc.setLineWidth(0.3)
            doc.line(tableX, y, tableX + contentWidth, y)
          }

          // Dibujar label "Servicio:" solo una vez por página
          if (!servicioLabelDrawn) {
            doc.setFont("helvetica", "bold")
            doc.setFontSize(9.5)
            doc.setTextColor(50, 50, 50)
            doc.text("Servicio:", tableX + 3, cellStartY + 5.5)
            servicioLabelDrawn = true
          }

          // Dibujar el bloque
          doc.setFont("helvetica", block.font)
          doc.setFontSize(block.size)
          doc.setTextColor(block.color[0], block.color[1], block.color[2])
          doc.text(lines, valueX, cursorY)
          cursorY += blockHeight
        }

        // Cerrar última celda
        y = cursorY + 3
        closeCellBorders()
        doc.line(tableX, y, tableX + contentWidth, y)
      }

      // --- Fila de Equipo Audiovisual (opcional) ---
      if (audiovisualData.length > 0) {
        const valueX = tableX + colLabelWidth + 3
        const maxValueWidth = colValueWidth - 6

        type PdfBlock = { type: "text"; font: string; size: number; color: [number, number, number]; text: string; lineHeight: number; extraSpacing?: number }
        const avBlocks: PdfBlock[] = []

        for (const av of audiovisualData) {
          const costoTxt = av.costosiniva ? ` $${av.costosiniva.toLocaleString("es-MX", { minimumFractionDigits: 2 })} más IVA` : ""
          const descTxt = av.descripcion ? ` ${av.descripcion}` : ""
          avBlocks.push({ type: "text", font: "normal", size: 9, color: [40, 40, 40], text: `*${av.nombre || ""}${descTxt}${costoTxt}`, lineHeight: 4, extraSpacing: 2 })
        }

        let avLabelDrawn = false
        let avCellStartY = y

        // Borde superior
        if (y === contentTopY) {
          doc.setDrawColor(160, 160, 160)
          doc.setLineWidth(0.3)
          doc.line(tableX, y, tableX + contentWidth, y)
        }
        avCellStartY = y
        let avCursorY = y + 5.5

        function closeAvCellBorders() {
          doc.setDrawColor(160, 160, 160)
          doc.setLineWidth(0.3)
          doc.line(tableX, avCellStartY, tableX, y)
          doc.line(tableX + colLabelWidth, avCellStartY, tableX + colLabelWidth, y)
          doc.line(tableX + contentWidth, avCellStartY, tableX + contentWidth, y)
        }

        for (const block of avBlocks) {
          doc.setFont("helvetica", block.font)
          doc.setFontSize(block.size)
          const lines = doc.splitTextToSize(block.text, maxValueWidth)
          const blockHeight = lines.length * block.lineHeight + (block.extraSpacing || 0)

          if (avCursorY + blockHeight > contentBottomY) {
            y = contentBottomY
            closeAvCellBorders()
            doc.line(tableX, y, tableX + contentWidth, y)

            pintarFooter()
            doc.addPage()
            pintarEncabezado()
            y = contentTopY
            avCellStartY = y
            avCursorY = y + 5.5
            avLabelDrawn = false

            doc.setDrawColor(160, 160, 160)
            doc.setLineWidth(0.3)
            doc.line(tableX, y, tableX + contentWidth, y)
          }

          if (!avLabelDrawn) {
            doc.setFont("helvetica", "bold")
            doc.setFontSize(8.5)
            doc.setTextColor(50, 50, 50)
            doc.text("Equipo", tableX + 3, avCellStartY + 5)
            doc.text("audiovisual:", tableX + 3, avCellStartY + 9)
            doc.setFontSize(7.5)
            doc.text("(opcional)", tableX + 3, avCellStartY + 13.5)
            avLabelDrawn = true
          }

          doc.setFont("helvetica", block.font)
          doc.setFontSize(block.size)
          doc.setTextColor(block.color[0], block.color[1], block.color[2])
          doc.text(lines, valueX, avCursorY)
          avCursorY += blockHeight
        }

        y = avCursorY + 3
        closeAvCellBorders()
        doc.line(tableX, y, tableX + contentWidth, y)
      }

      // --- Sección Presupuesto ---
      if (presupuestoItems.length > 0) {
        y += 10
        checkNewPage(30)

        // Título "Presupuesto"
        doc.setFont("helvetica", "bold")
        doc.setFontSize(14)
        doc.setTextColor(50, 50, 50)
        doc.text("Presupuesto", marginLeft, y)
        y += 6

        // Línea decorativa
        doc.setDrawColor(50, 50, 50)
        doc.setLineWidth(0.5)
        const presTitleW = doc.getTextWidth("Presupuesto")
        doc.line(marginLeft, y, marginLeft + presTitleW, y)
        y += 6

        // Texto introductorio
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const presIntro = "Presentamos un total estimado de su evento. Sujeto a cambios por solicitud del Cliente antes o durante la ejecución del mismo."
        const introLines = doc.splitTextToSize(presIntro, contentWidth)
        doc.text(introLines, marginLeft, y)
        y += introLines.length * 4 + 6

        // Tabla de presupuesto
        const fmt = (n: number) => n > 0 ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "-"
        const colWidths = [8, 32, 20, 22, 20, 18, 22, 16, 12, 24] // total ~194 ≈ contentWidth(170) — ajustamos
        const totalColW = colWidths.reduce((a, b) => a + b, 0)
        const scale = contentWidth / totalColW
        const cols = colWidths.map(w => w * scale)
        const headers = ["#", "Concepto", "Tipo", "Precio", "IVA", "Servicio", "Subtotal", "Cant.", "Días", "Total"]
        const headerAligns: ("left" | "right" | "center")[] = ["center", "left", "left", "right", "right", "right", "right", "center", "center", "right"]

        // Header row
        checkNewPage(14)
        const headerH = 7
        doc.setFillColor(50, 50, 50)
        doc.rect(tableX, y, contentWidth, headerH, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.setTextColor(255, 255, 255)
        let colX = tableX
        for (let i = 0; i < headers.length; i++) {
          const align = headerAligns[i]
          const textX = align === "right" ? colX + cols[i] - 2 : align === "center" ? colX + cols[i] / 2 : colX + 2
          doc.text(headers[i], textX, y + 5, { align })
          colX += cols[i]
        }
        y += headerH

        // Data rows
        for (let idx = 0; idx < presupuestoItems.length; idx++) {
          const item = presupuestoItems[idx]
          const rowH = 6.5
          checkNewPage(rowH + 2)

          // Si es nueva página, re-dibujar header
          if (y === contentTopY) {
            doc.setFillColor(50, 50, 50)
            doc.rect(tableX, y, contentWidth, headerH, "F")
            doc.setFont("helvetica", "bold")
            doc.setFontSize(7)
            doc.setTextColor(255, 255, 255)
            let hx = tableX
            for (let i = 0; i < headers.length; i++) {
              const align = headerAligns[i]
              const textX = align === "right" ? hx + cols[i] - 2 : align === "center" ? hx + cols[i] / 2 : hx + 2
              doc.text(headers[i], textX, y + 5, { align })
              hx += cols[i]
            }
            y += headerH
          }

          // Fondo alternado
          if (idx % 2 === 1) {
            doc.setFillColor(245, 245, 245)
            doc.rect(tableX, y, contentWidth, rowH, "F")
          }

          doc.setFontSize(7)
          doc.setTextColor(40, 40, 40)
          const rowData = [
            String(idx + 1),
            item.concepto,
            item.tipo,
            item.precio > 0 ? fmt(item.precio) : "Por definir",
            item.iva > 0 ? fmt(item.iva) : "-",
            item.servicio > 0 ? fmt(item.servicio) : "-",
            item.subtotal > 0 ? fmt(item.subtotal) : "Por definir",
            item.cantidad ? String(item.cantidad) : "-",
            String(item.dias),
            item.total > 0 ? fmt(item.total) : "Por definir",
          ]

          colX = tableX
          for (let i = 0; i < rowData.length; i++) {
            const align = headerAligns[i]
            doc.setFont("helvetica", i === 1 || i === 9 ? "bold" : "normal")
            const textX = align === "right" ? colX + cols[i] - 2 : align === "center" ? colX + cols[i] / 2 : colX + 2
            // Truncar concepto si es muy largo
            let cellText = rowData[i]
            if (i === 1) {
              const maxW = cols[i] - 4
              while (doc.getTextWidth(cellText) > maxW && cellText.length > 3) {
                cellText = cellText.slice(0, -1)
              }
              if (cellText !== rowData[i]) cellText += "…"
            }
            doc.text(cellText, textX, y + 4.5, { align })
            colX += cols[i]
          }

          // Línea separadora
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.2)
          doc.line(tableX, y + rowH, tableX + contentWidth, y + rowH)
          y += rowH
        }

        // Fila Total
        const totalRowH = 7
        checkNewPage(totalRowH)
        doc.setFillColor(50, 50, 50, 0.05)
        doc.setDrawColor(50, 50, 50)
        doc.setLineWidth(0.5)
        doc.line(tableX, y, tableX + contentWidth, y)
        doc.setFillColor(235, 235, 235)
        doc.rect(tableX, y, contentWidth, totalRowH, "F")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(8)
        doc.setTextColor(40, 40, 40)
        // "Total" alineado a la derecha en la penúltima col
        const totalLabelX = tableX + cols.slice(0, 9).reduce((a, b) => a + b, 0) - 2
        doc.text("Total", totalLabelX, y + 5, { align: "right" })

        // Valor total
        const grandTotal = presupuestoItems.reduce((sum, i) => sum + i.total, 0)
        doc.setFontSize(8.5)
        doc.setTextColor(50, 50, 50)
        const totalValX = tableX + contentWidth - 2
        doc.text(grandTotal > 0 ? fmt(grandTotal) : "Por definir", totalValX, y + 5, { align: "right" })
        y += totalRowH + 2

        // Línea inferior tabla
        doc.setDrawColor(50, 50, 50)
        doc.setLineWidth(0.5)
        doc.line(tableX, y - 2, tableX + contentWidth, y - 2)

        // --- Texto precios (formatocotizacion.textoprecios) alineado a la derecha ---
        if (formato.textoprecios) {
          y += 4
          checkNewPage(20)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(8.5)
          doc.setTextColor(60, 60, 60)
          const preciosLines = doc.splitTextToSize(formato.textoprecios, contentWidth)
          for (const line of preciosLines) {
            checkNewPage(5)
            doc.text(line, pageWidth - 20, y, { align: "right" })
            y += 4
          }
          y += 4
        }

        // --- Cortesías ---
        const cortesiasItems = elementosPaquete.filter((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "cortesias")
        if (cortesiasItems.length > 0) {
          checkNewPage(15)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(11)
          doc.setTextColor(50, 50, 50)
          doc.text("Cortesías", marginLeft, y)
          y += 3

          // Línea decorativa
          doc.setDrawColor(50, 50, 50)
          doc.setLineWidth(0.4)
          const cortW = doc.getTextWidth("Cortesías")
          doc.line(marginLeft, y, marginLeft + cortW, y)
          y += 6

          for (const cort of cortesiasItems) {
            checkNewPage(6)
            const cortNombre = cort.descripcion || cort.nombre || cort.elemento || ""
            doc.setFont("helvetica", "normal")
            doc.setFontSize(9.5)
            doc.setTextColor(40, 40, 40)
            doc.text(`•  ${cortNombre}`, marginLeft + 3, y)
            y += 5.5
          }
          y += 4
        }
      }
      } // ======== FIN LOOP POR RESERVACIÓN ========

      // --- Texto adicional (formatocotizacion.textoadicional) ---
      if (formato.textoadicional) {
        y += 6
        checkNewPage(15)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(40, 40, 40)
        // Respetar saltos de línea del campo
        const parrafos = formato.textoadicional.split(/\r?\n/)
        for (const parrafo of parrafos) {
          if (parrafo.trim() === "") {
            y += 4
            continue
          }
          const pLines = doc.splitTextToSize(parrafo, contentWidth)
          const pHeight = pLines.length * 4
          checkNewPage(pHeight)
          doc.text(pLines, marginLeft, y)
          y += pHeight + 1.5
        }
        y += 4
      }

      // --- Mensaje de cierre con nombre del cliente ---
      {
        y += 4
        checkNewPage(25)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9.5)
        doc.setTextColor(40, 40, 40)
        const mensajeCierre = `Estimado(a) ${formData.nombreCliente || "Cliente"}, reiteramos nuestro agradecimiento por su preferencia y confiamos que la presente cotización cumpla con sus expectativas. Quedo a sus órdenes y en espera de su favorable respuesta para proceder a elaborar el contrato correspondiente, la cual detallará las políticas aplicables de su evento.`
        const cierreLines = doc.splitTextToSize(mensajeCierre, contentWidth)
        const cierreHeight = cierreLines.length * 4.5
        checkNewPage(cierreHeight)
        doc.text(cierreLines, marginLeft, y)
        y += cierreHeight + 6
      }

      // --- Footer de la última página ---
      pintarFooter()

      // Abrir PDF en nueva pestaña
      const pdfBlob = doc.output("blob")
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, "_blank")
      setPdfGenerated(true)
    } catch (error) {
      console.error("Error generando PDF:", error)
      alert("Error al generar el PDF de cotización.")
    }
    setGeneratingPDF(false)
  }

  async function handleAbrirAgregar(tipo: string, tipoPlatillo: string | null = null, alimentoParentIdOverride?: number) {
    setAgregarTipo(tipo)
    setSelectedElementoId("")
    setSelectedElementoIds(new Set())
    setPreviewElementoId(null)
    setPreviewElementoPdf("")
    setElementoSearch("")
    setElementosTabla([])
    setShowAgregarModal(true)
    setLoadingTabla(true)
    if (tipo === "alimentos") {
      setAlimentosTab("alimento")
    }
    if (tipo === "platillos") {
      // Usar el alimento pasado como parent (multi-alimento). Si no, cae al primero existente.
      let platilloId = alimentoParentIdOverride ?? -1
      if (platilloId === -1) {
        const alimentoEl = elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
        platilloId = alimentoEl ? Number(alimentoEl.elementoid ?? alimentoEl.id) : -1
      }
      setSelectedAlimentoParentId(platilloId > 0 ? platilloId : null)
      const hotelId = formData.hotel ? Number(formData.hotel) : -1
      const result = await buscarPlatillosItems(platilloId, hotelId, tipoPlatillo)
      if (result.success && result.data) {
        // No filtrar: mostrar todas las variantes agrupadas por nombre (incluye opciones de horas).
        // Los ya agregados se marcan visualmente en el render.
        setElementosTabla(result.data)
        // Pre-seleccionar los platillos ya agregados a ese alimento
        const yaIds = new Set(
          platillosItems
            .filter((p: any) => Number(p.platilloid) === platilloId)
            .map((p: any) => Number(p.elementoid))
        )
        setSelectedElementoIds(yaIds)
      }
    } else if (tipo === "consumo") {
      let menubebidaId = alimentoParentIdOverride ?? -1
      if (menubebidaId === -1) {
        const bebidaEl = elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "bebidas")
        menubebidaId = bebidaEl ? Number(bebidaEl.elementoid ?? bebidaEl.id) : -1
      }
      const result = await buscarConsumoPorMenu(menubebidaId)
      if (result.success && result.data) {
        const yaAsignados = new Set(
          elementosPaquete
            .filter(el => normalizarSeccion(el.tipoelemento || el.tipo || "") === "consumo")
            .map(el => Number(el.elementoid ?? el.id))
        )
        setElementosTabla(result.data.filter((el: any) => !yaAsignados.has(Number(el.id))))
      }
    } else {
      const result = tipo === "lugar"
        ? await buscarLugaresPorHotel(Number(formData.hotel))
        : await buscarElementosPorTabla(tipo)
      if (result.success && result.data) {
        if (tipo === "alimentos") {
          // Multi-alimento: filtrar los ya agregados para evitar duplicados
          const yaAsignados = new Set(
            elementosPaquete
              .filter((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
              .map((el: any) => Number(el.elementoid ?? el.id))
          )
          setElementosTabla(result.data.filter((el: any) => !yaAsignados.has(Number(el.id))))
          // Poblar mapa de tipomenu para todos los menús cargados
          const tipoMenuUpdate: Record<number, string> = {}
          for (const m of result.data) if ((m as any).tipomenu) tipoMenuUpdate[Number((m as any).id)] = String((m as any).tipomenu)
          if (Object.keys(tipoMenuUpdate).length > 0) setAlimentosTipoMenu(prev => ({ ...prev, ...tipoMenuUpdate }))
          // Multi-alimento: no pre-seleccionar. Reset estado del modal.
          setMenuTipoActual(null)
          setExpandedAlimentoGroups(new Set())
          setSelectedAlimentoParentId(null)
        } else {
          const yaAsignados = new Set(
            elementosPaquete
              .filter(el => normalizarSeccion(el.tipoelemento || el.tipo || "") === tipo)
              .map(el => Number(el.elementoid ?? el.id))
          )
          setElementosTabla(result.data.filter((el: any) => !yaAsignados.has(Number(el.id))))
        }
      }
    }
    setLoadingTabla(false)
  }

  // Sincroniza (diff) los platillos de un alimento Individual en el modal.
  // Recalcula el renglón "Paquete" en presupuesto basado en el menú principal (Completo) y sus platillos.
  async function recalcularPresupuestoPaquete(platillosActuales?: any[], elementosActuales?: any[]) {
    const plats = platillosActuales ?? platillosItems
    const elems = elementosActuales ?? elementosPaquete
    // Determinar paqueteId: state → si está vacío, consultar en DB
    let paqueteId = selectedPaqueteId ? Number(selectedPaqueteId) : 0
    if (!paqueteId && cotizacionId) {
      try {
        const supa = (await import("@/lib/supabase/client")).createClient()
        const { data: resRow } = await supa
          .from("eventoxreservaciones")
          .select("paqueteid")
          .eq("id", cotizacionId)
          .not("paqueteid", "is", null)
          .limit(1)
          .maybeSingle()
        if (resRow?.paqueteid) {
          paqueteId = Number(resRow.paqueteid)
          setSelectedPaqueteId(String(paqueteId))
        }
      } catch {}
    }
    if (!paqueteId) {
      // Sin paquete asignado → asegurar que no haya renglón Paquete
      setPresupuestoItems(prev => prev.filter(p => p.tipo !== "Paquete"))
      return
    }
    // Determinar el menú principal: el que tiene tipomenu="Completo"; si no hay, el primero con platillos
    const alimentosEnPaquete = elems.filter((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
    let menuPrincipal: any = null
    for (const alim of alimentosEnPaquete) {
      const alimId = Number(alim.elementoid ?? alim.id)
      if ((alimentosTipoMenu[alimId] || "").toLowerCase() === "completo") { menuPrincipal = alim; break }
    }
    if (!menuPrincipal) {
      for (const alim of alimentosEnPaquete) {
        const alimId = Number(alim.elementoid ?? alim.id)
        if (plats.some((p: any) => Number(p.platilloid) === alimId)) { menuPrincipal = alim; break }
      }
    }
    if (!menuPrincipal) {
      // Sin menú principal con platillos → quitar renglón Paquete
      setPresupuestoItems(prev => prev.filter(p => p.tipo !== "Paquete"))
      return
    }
    const menuPrincipalId = Number(menuPrincipal.elementoid ?? menuPrincipal.id)
    const platillosDeMenu = plats.filter((p: any) => Number(p.platilloid) === menuPrincipalId)
    // Determinar el platillo clave para calcular precio:
    //  - Completo: requiere uno de "Plato Fuerte"
    //  - Individual (u otros): cualquier platillo (sección "Platillos")
    const tipoMenuPrincipal = (alimentosTipoMenu[menuPrincipalId] || "").toLowerCase()
    const esCompletoMenu = tipoMenuPrincipal === "completo"
    const platilloClave = esCompletoMenu
      ? platillosDeMenu.find((p: any) => (p.tipo || "").toUpperCase() === "PLATO FUERTE")
      : platillosDeMenu[0]
    if (!platilloClave) {
      // Falta el platillo requerido → quitar renglón Paquete
      setPresupuestoItems(prev => prev.filter(p => p.tipo !== "Paquete"))
      return
    }
    const platilloId = Number(platilloClave.elementoid ?? platilloClave.id)
    const resultado = await obtenerPrecioPaquetePorPlatillo(paqueteId, platilloId)
    const precio = resultado.precio || 0
    // Si el precio salió en 0, mostrar info de debug en consola del navegador (F12 → Console)
    if (precio === 0) {
      console.log("[Precio Paquete = 0] Debug:", (resultado as any).debug)
    }
    const nombreMenu = menuPrincipal.descripcion || menuPrincipal.nombre || menuPrincipal.elemento || "Paquete"
    const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
    const numInvitados = Number(formData.numeroInvitados) || 0
    setPresupuestoItems(prev => {
      const sinPaquete = prev.filter(p => p.tipo !== "Paquete")
      return [...sinPaquete, crearPresupuestoItem(nombreMenu, "Paquete", precio, dias, 0, numInvitados)]
    })
  }

  async function handleSyncPlatillosIndividual(alimentoParentId: number | null, selectedIds: number[]) {
    if (!cotizacionId) return { success: false, error: "Sin cotización" }
    const hotelId = Number(formData.hotel)
    try {
      const existentes = platillosItems.filter((p: any) =>
        alimentoParentId == null || Number(p.platilloid) === alimentoParentId
      )
      const existentesIds = new Set(existentes.map((p: any) => Number(p.elementoid)))
      const selSet = new Set(selectedIds)
      // Eliminar los que ya no están seleccionados
      for (const ex of existentes) {
        const eid = Number(ex.elementoid)
        if (!selSet.has(eid)) {
          await eliminarElementoCotizacion(cotizacionId, ex.tipoelemento || "Platillo", eid)
        }
      }
      // Agregar los nuevos
      for (const id of selectedIds) {
        if (!existentesIds.has(id)) {
          await agregarElementoACotizacion(cotizacionId, hotelId, id, "platillos")
        }
      }
      const platRes = await obtenerPlatillosCotizacion(cotizacionId)
      if (platRes.success && platRes.data) {
        setPlatillosItems(platRes.data)
        await recalcularPresupuestoPaquete(platRes.data)
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) }
    }
  }

  async function handleAgregarElemento(overrideTipo?: string, idsOverride?: number[]) {
    if (!cotizacionId) return
    const effectiveTipo = overrideTipo ?? agregarTipo
    // Lugar: single-select (usa selectedElementoId como antes). Otros tipos: multi-select.
    const ids = idsOverride ?? (effectiveTipo === "lugar"
      ? (selectedElementoId ? [Number(selectedElementoId)] : [])
      : Array.from(selectedElementoIds))
    if (ids.length === 0) return
    setSavingElemento(true)
    let result: any
    if (effectiveTipo === "lugar") {
      result = await modificarLugarCotizacion(cotizacionId, Number(formData.hotel), ids[0])
    } else {
      // Batch: llamar a agregarElementoACotizacion por cada id
      let anyError: string | null = null
      for (const id of ids) {
        const bpid = effectiveTipo === "consumo" ? selectedBebidaPrecios[id] : undefined
        const r = await agregarElementoACotizacion(cotizacionId, Number(formData.hotel), id, effectiveTipo, bpid)
        if (!r.success) { anyError = r.error || "Error"; break }
      }
      result = anyError ? { success: false, error: anyError } : { success: true }
    }
    if (result.success) {
      const [elementosResult, platRes] = await Promise.all([
        obtenerElementosCotizacion(cotizacionId),
        obtenerPlatillosCotizacion(cotizacionId),
      ])
      if (elementosResult.success && elementosResult.data) setElementosPaquete(elementosResult.data)
      if (platRes.success && platRes.data) setPlatillosItems(platRes.data)
      // El renglón "Paquete" se crea/actualiza en recalcularPresupuestoPaquete al guardar platillos.
      setShowAgregarModal(false)
      setSelectedElementoId("")
      setSelectedElementoIds(new Set())
      setSelectedBebidaPrecios({})
      setPreviewElementoId(null)
      setPreviewElementoPdf("")
      setElementoSearch("")
    } else {
      alert(`Error al agregar elemento: ${result.error}`)
    }
    setSavingElemento(false)
  }

  function loadElementoPreview(el: any) {
    const id = Number(el.id)
    setPreviewElementoId(id)
    setPreviewElementoPdf(el?.documentopdf || "")
  }

  // Añade un Alimento (si no existe) y auto-avanza a la pestaña de platillos para ese menú.
  // Soporta múltiples alimentos en la cotización; cada uno conservará sus propios platillos.
  async function handleAlimentoSeleccionado(elementoId: number, elemento?: any) {
    if (!cotizacionId) return
    const tipoMenu = (elemento?.tipomenu || "").toString().trim()
    if (tipoMenu) {
      setMenuTipoActual(tipoMenu)
      setAlimentosTipoMenu(prev => ({ ...prev, [elementoId]: tipoMenu }))
    }
    setSelectedAlimentoParentId(elementoId)
    setSavingElemento(true)
    try {
      const yaExiste = elementosPaquete.some((el: any) =>
        normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos" &&
        Number(el.elementoid ?? el.id) === elementoId
      )
      if (!yaExiste) {
        await agregarElementoACotizacion(cotizacionId, Number(formData.hotel), elementoId, "alimentos")
        const [elRes, plRes] = await Promise.all([
          obtenerElementosCotizacion(cotizacionId),
          obtenerPlatillosCotizacion(cotizacionId),
        ])
        if (elRes.success && elRes.data) {
          setElementosPaquete(elRes.data)
        }
        if (plRes.success && plRes.data) setPlatillosItems(plRes.data)
        // El renglón "Paquete" se crea/actualiza en recalcularPresupuestoPaquete al guardar platillos.
      }

      // Cargar platillos disponibles para este alimento y avanzar pestaña según tipomenu
      const hotelId = Number(formData.hotel)
      const isCompleto = tipoMenu === "Completo"
      if (isCompleto) {
        const [rE, rP, rPo] = await Promise.all([
          buscarPlatillosItems(elementoId, hotelId, "ENTRADAS"),
          buscarPlatillosItems(elementoId, hotelId, "PLATO FUERTE"),
          buscarPlatillosItems(elementoId, hotelId, "POSTRES"),
        ])
        setPlatillosTabla({
          "ENTRADAS": rE.success && rE.data ? rE.data : [],
          "PLATO FUERTE": rP.success && rP.data ? rP.data : [],
          "POSTRES": rPo.success && rPo.data ? rPo.data : [],
        })
        setPlatillosSeleccion({ "ENTRADAS": null, "PLATO FUERTE": null, "POSTRES": null })
        setAlimentosTab("ENTRADAS")
      } else {
        const r = await buscarPlatillosItems(elementoId, hotelId, null)
        setElementosTabla(r.success && r.data ? r.data : [])
        setSelectedElementoIds(new Set())
        setSelectedElementoId("")
        setPreviewElementoId(null)
        setPreviewElementoPdf("")
        setAlimentosTab("platillos")
      }
    } catch (err: any) {
      alert(`Error al seleccionar alimento: ${err?.message || err}`)
    } finally {
      setSavingElemento(false)
    }
  }

  // Cambia de pestaña dentro del modal unificado de Alimentos
  async function cambiarAlimentosTab(tab: string) {
    setAlimentosTab(tab)
    setPreviewElementoId(null)
    setPreviewElementoPdf("")
    setElementoSearch("")
    if (tab === "alimento") {
      // Recargar lista de alimentos
      setLoadingTabla(true)
      const result = await buscarElementosPorTabla("alimentos")
      if (result.success && result.data) {
        setElementosTabla(result.data)
      }
      setLoadingTabla(false)
    } else if (tab === "platillos") {
      // Cargar platillos (paquete no-Completo) del alimento seleccionado
      const alimEl = elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
      if (!alimEl) return
      const alimId = Number(alimEl.elementoid ?? alimEl.id)
      setLoadingTabla(true)
      const r = await buscarPlatillosItems(alimId, Number(formData.hotel), null)
      if (r.success && r.data) {
        const yaAsignados = new Set(platillosItems.map((p: any) => Number(p.elementoid ?? p.id)))
        setElementosTabla(r.data.filter((el: any) => !yaAsignados.has(Number(el.id))))
      }
      setSelectedElementoIds(new Set())
      setLoadingTabla(false)
    } else if (tab === "ENTRADAS" || tab === "PLATO FUERTE" || tab === "POSTRES") {
      // Asegurar que platillosTabla esté cargada para el alimento actual
      const alimEl = elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
      if (!alimEl) return
      const alimId = Number(alimEl.elementoid ?? alimEl.id)
      if (!platillosTabla[tab as PlatilloTipo] || platillosTabla[tab as PlatilloTipo].length === 0) {
        setLoadingTabla(true)
        const r = await buscarPlatillosItems(alimId, Number(formData.hotel), tab)
        if (r.success && r.data) {
          setPlatillosTabla(prev => ({ ...prev, [tab as PlatilloTipo]: r.data as any[] }))
        }
        setLoadingTabla(false)
      }
      // Pre-seleccionar desde platillosItems actuales si existe
      const existente = platillosItems.find((p: any) => (p.tipo || "").toUpperCase() === tab)
      if (existente && platillosSeleccion[tab as PlatilloTipo] == null) {
        setPlatillosSeleccion(prev => ({ ...prev, [tab as PlatilloTipo]: Number(existente.elementoid ?? existente.id) }))
      }
    }
  }

  async function handleAbrirPlatillosModal(initialTipo: PlatilloTipo = "ENTRADAS", alimentoParentIdOverride?: number) {
    setShowPlatillosModal(true)
    setPlatillosActiveTipo(initialTipo)
    setPlatillosSearch("")
    setPlatillosPreviewPdf("")
    setPlatillosPreviewId(null)
    setLoadingPlatillosModal(true)
    // Determinar alimento padre (multi-alimento: usa override; si no, el primero)
    let platilloId = alimentoParentIdOverride ?? -1
    if (platilloId === -1) {
      const alimentoEl = elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
      platilloId = alimentoEl ? Number(alimentoEl.elementoid ?? alimentoEl.id) : -1
    }
    setSelectedAlimentoParentId(platilloId > 0 ? platilloId : null)
    // Pre-seleccionar según platillosItems ya agregados a ESE alimento padre
    const selInit: Record<PlatilloTipo, number | null> = { "ENTRADAS": null, "PLATO FUERTE": null, "POSTRES": null }
    for (const t of PLATILLOS_TIPOS) {
      const existente = platillosItems.find((p: any) => (p.tipo || "").toUpperCase() === t && Number(p.platilloid) === platilloId)
      if (existente) selInit[t] = Number(existente.elementoid ?? existente.id)
    }
    setPlatillosSeleccion(selInit)

    const hotelId = formData.hotel ? Number(formData.hotel) : -1

    const [rE, rP, rPo] = await Promise.all([
      buscarPlatillosItems(platilloId, hotelId, "ENTRADAS"),
      buscarPlatillosItems(platilloId, hotelId, "PLATO FUERTE"),
      buscarPlatillosItems(platilloId, hotelId, "POSTRES"),
    ])
    setPlatillosTabla({
      "ENTRADAS": rE.success && rE.data ? rE.data : [],
      "PLATO FUERTE": rP.success && rP.data ? rP.data : [],
      "POSTRES": rPo.success && rPo.data ? rPo.data : [],
    })
    setLoadingPlatillosModal(false)
  }

  async function handleGuardarPlatillos(selectionOverride?: Record<PlatilloTipo, number | null>) {
    if (!cotizacionId) return
    setSavingPlatillos(true)
    try {
      const sel = selectionOverride ?? platillosSeleccion
      const parentId = selectedAlimentoParentId
      for (const tipo of PLATILLOS_TIPOS) {
        // Buscar platillo existente del mismo alimento padre (multi-menú)
        const existente = platillosItems.find((p: any) =>
          (p.tipo || "").toUpperCase() === tipo &&
          (parentId == null || Number(p.platilloid) === parentId)
        )
        const target = sel[tipo]
        const existenteId = existente ? Number(existente.elementoid ?? existente.id) : null
        if (existenteId && existenteId !== target) {
          await eliminarElementoCotizacion(cotizacionId, "Platillo", existenteId)
        }
        if (target && target !== existenteId) {
          await agregarElementoACotizacion(cotizacionId, Number(formData.hotel), target, "platillos")
        }
      }
      // Recargar platillos y recalcular presupuesto
      const platRes = await obtenerPlatillosCotizacion(cotizacionId)
      if (platRes.success && platRes.data) {
        setPlatillosItems(platRes.data)
        await recalcularPresupuestoPaquete(platRes.data)
      }
      setShowPlatillosModal(false)
    } catch (err: any) {
      alert(`Error al guardar platillos: ${err?.message || err}`)
    } finally {
      setSavingPlatillos(false)
    }
  }

  async function handleConfirmPaquete() {
    if (!previewPaqueteId || !cotizacionId) return
    if (elementosPaquete.length > 0) {
      setShowConfirmReemplazarModal(true)
      return
    }
    await ejecutarAsignarPaquete()
  }

  async function ejecutarAsignarPaquete() {
    if (!previewPaqueteId || !cotizacionId) return
    setShowConfirmReemplazarModal(false)
    setAssigningPaquete(true)
    try {
      await limpiarElementosCotizacion(cotizacionId)
      const result = await asignarPaqueteACotizacion(cotizacionId, Number(previewPaqueteId), Number(formData.hotel))
      if (result.success) {
        setSelectedPaqueteId(previewPaqueteId)
        setSelectedPaqueteInfo(previewPaqueteInfo)
        const elementosResult = await obtenerElementosCotizacion(cotizacionId)
        if (elementosResult.success && elementosResult.data) {
          setElementosPaquete(elementosResult.data)
        }
        // Limpiar platillos legacy del presupuesto; el renglón "Paquete" se creará al guardar platillos
        setPresupuestoItems(prev => prev.filter(p => p.tipo !== "Paquete" && p.tipo !== "Platillo"))
        // Si ya hay platillos (caso edición), recalcular de inmediato
        const platRes2 = await obtenerPlatillosCotizacion(cotizacionId)
        if (platRes2.success && platRes2.data && platRes2.data.length > 0) {
          setPlatillosItems(platRes2.data)
          await recalcularPresupuestoPaquete(platRes2.data)
        }
        setShowPaqueteModal(false)
        setPreviewPaqueteId("")
        setPreviewPaqueteInfo(null)
        setElementosPreviewPaquete([])
      } else {
        alert(`Error al asignar paquete: ${result.error}`)
      }
    } catch (error) {
      console.error("Error asignando paquete:", error)
      alert("Error inesperado al asignar el paquete")
    } finally {
      setAssigningPaquete(false)
    }
  }

  async function loadHoteles() {
    const result = await listaDesplegableHoteles()
    if (result.success && result.data) {
      setHoteles(result.data)
    }
  }

  async function loadSalones(hotelId: string) {
    const result = await listaDesplegableSalones(-1, "", Number(hotelId))
    if (result.success && result.data) {
      const seen = new Set<string>()
      const unique = (result.data as any[]).filter((s: any) => {
        const k = String(s.value ?? "")
        if (!k || seen.has(k)) return false
        seen.add(k); return true
      }) as any
      setSalones(unique)
    }
  }

  async function loadMontajes(salonId: string, esModoEdicion = false) {
    const result = await objetoSalon(Number(salonId))

    if (result.success && result.data) {
      // En creación, pre-llenar No. Invitados con capacidadminima del salón
      if (!esModoEdicion && result.data.capacidadminima != null) {
        setFormData(prev => ({ ...prev, adultos: result.data!.capacidadminima!.toString(), ninos: "", numeroInvitados: result.data!.capacidadminima!.toString() }))
      }

      // Cargar montajes (dedup por id para evitar keys duplicadas en Select)
      if (result.data.montajes) {
        const seen = new Set<string>()
        const montajesOptions = result.data.montajes
          .filter((m) => m.id && m.montaje)
          .map((m) => ({
            value: m.id!.toString(),
            text: m.montaje!,
          }))
          .filter((m) => {
            if (seen.has(m.value)) return false
            seen.add(m.value); return true
          })
        setMontajes(montajesOptions)
      }

      // Cargar fotos del salón
      const fotosData = result.data.fotos
      if (fotosData && Array.isArray(fotosData) && fotosData.length > 0) {
        setSalonFotos(fotosData as string[])
      } else {
        setSalonFotos([])
      }
      setCurrentPhotoIndex(0)
    } else {
      setSalonFotos([])
      setCurrentPhotoIndex(0)
    }

    // Cargar reservaciones del salón para validar disponibilidad
    const resResult = await obtenerDisponibilidadSalon(Number(salonId))
    console.log("[DISPO] salonId:", salonId, "success:", resResult.success, "error:", resResult.error, "reservaciones:", resResult.data?.length, "data:", JSON.stringify(resResult.data?.map((r: any) => ({ salonid: r.salonid, salon: r.salon, fecha: r.fechainicio }))))
    if (resResult.success && resResult.data) {
      setSalonReservaciones(resResult.data)
    } else {
      setSalonReservaciones([])
    }
  }

  async function loadClientes() {
    try {
      const result = await listaDesplegableClientes()
      if (result.success && result.data) {
        setClientes(result.data)
        setFilteredClientes(result.data)
      }
    } catch (error) {
      console.error("Error loading clientes:", error)
    }
  }

  async function handleRegistrarCliente() {
    setNuevoClienteError("")
    if (!nuevoClienteForm.tipo) { setNuevoClienteError("El tipo de cliente es requerido"); return }
    if (!nuevoClienteForm.nombre.trim()) { setNuevoClienteError("El nombre es requerido"); return }
    if (!nuevoClienteForm.apellidopaterno.trim()) { setNuevoClienteError("El apellido paterno es requerido"); return }
    if (!nuevoClienteForm.email.trim()) { setNuevoClienteError("El email es requerido"); return }
    if (!nuevoClienteForm.telefono.trim()) { setNuevoClienteError("El teléfono es requerido"); return }
    if (nuevoClienteForm.tipo === "Empresarial" && !nuevoClienteForm.empresa.trim()) { setNuevoClienteError("El nombre de empresa es requerido"); return }

    setNuevoClienteLoading(true)
    try {
      const fd = new FormData()
      fd.set("nombre", nuevoClienteForm.nombre.trim())
      fd.set("apellidopaterno", nuevoClienteForm.apellidopaterno.trim())
      fd.set("apellidomaterno", nuevoClienteForm.apellidomaterno.trim())
      fd.set("email", nuevoClienteForm.email.trim())
      fd.set("telefono", nuevoClienteForm.telefono.trim())
      fd.set("celular", nuevoClienteForm.celular.trim())
      fd.set("direccion", nuevoClienteForm.direccion.trim())
      fd.set("tipo", nuevoClienteForm.tipo)
      if (nuevoClienteForm.tipo === "Empresarial") {
        fd.set("notas", `Empresa: ${nuevoClienteForm.empresa.trim()}`)
      }

      const result = await crearCliente(fd)
      if (result.success) {
        await loadClientes()
        const nombreCompleto = `${nuevoClienteForm.nombre} ${nuevoClienteForm.apellidopaterno} ${nuevoClienteForm.apellidomaterno}`.trim()
        setFormData(prev => ({
          ...prev,
          nombreCliente: nombreCompleto,
          email: nuevoClienteForm.email,
          telefono: nuevoClienteForm.telefono,
        }))
        setSelectedClienteId(result.data?.toString() ?? "")
        setShowNuevoClienteModal(false)
        setNuevoClienteForm({ tipo: "", nombre: "", apellidopaterno: "", apellidomaterno: "", email: "", telefono: "", celular: "", direccion: "", empresa: "" })
      } else {
        setNuevoClienteError(result.error ?? "Error al registrar cliente")
      }
    } catch (error) {
      setNuevoClienteError("Error inesperado al registrar cliente")
    } finally {
      setNuevoClienteLoading(false)
    }
  }

  const handleClienteInputChange = (value: string) => {
    setSelectedClienteId("") // invalidar selección al tipear manualmente
    if (value.trim() === "") {
      setFormData(prev => ({ ...prev, nombreCliente: "", empresa: "", grupo: "", email: "", telefono: "" }))
      setFilteredClientes(clientes)
      setShowClienteDropdown(false)
      setSelectedClienteId("")
      return
    }

    setFormData(prev => ({ ...prev, nombreCliente: value }))
    const searchTerm = value.toLowerCase()
    const filtered = clientes.filter((cliente) =>
      cliente.text.toLowerCase().includes(searchTerm) ||
      cliente.email.toLowerCase().includes(searchTerm) ||
      cliente.telefono.includes(searchTerm)
    )

    setFilteredClientes(filtered)
    setShowClienteDropdown(filtered.length > 0)
  }

  const handleClienteSelect = async (cliente: { value: string; text: string }) => {
    setFormData(prev => ({ ...prev, nombreCliente: cliente.text }))
    setSelectedClienteId(cliente.value)
    setShowClienteDropdown(false)

    // Fetch client details to autofill email and telefono
    try {
      const clienteId = Number.parseInt(cliente.value)
      const [result, empresaResult, grupoResult] = await Promise.all([
        objetoCliente(clienteId),
        obtenerEmpresaPorCliente(clienteId),
        obtenerGrupoEmpresa(clienteId),
      ])
      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          nombreCliente: cliente.text,
          empresa: empresaResult.success ? empresaResult.nombre : "",
          grupo: grupoResult.success ? grupoResult.nombre : "",
          email: result.data.email || "",
          telefono: result.data.telefono || "",
        }))
      }
    } catch (error) {
      console.error("Error fetching client details:", error)
    }
  }

  function isTabDirty(idx: number): boolean {
    const saved = lastSavedTabSnapshotsRef.current[idx]
    if (!saved) return false
    const current = idx === activeReservacionIdx
      ? captureCurrentTabSnapshot()
      : tabSnapshotsRef.current[idx]
    if (!current) return false
    const norm = (v: any) => {
      if (v === null || v === undefined || v === "") return ""
      const s = String(v).trim()
      // Normalizar numéricos: "0" == "0.0" == "0.00"
      if (/^-?\d+(\.\d+)?$/.test(s)) {
        const n = Number(s)
        return Number.isFinite(n) ? String(n) : s
      }
      return s
    }
    const diffs: { key: string; current: any; saved: any }[] = []
    for (const k of perReservacionFormKeys) {
      const c = norm(current.formData?.[k])
      const s = norm(saved.formData?.[k])
      if (c !== s) diffs.push({ key: k, current: current.formData?.[k], saved: saved.formData?.[k] })
    }
    return diffs.length > 0
  }

  // Guarda la cotización sin mostrar alertas. Retorna success/error para que el caller decida UX.
  async function saveCotizacion(): Promise<{ success: boolean; error?: string; created?: boolean }> {
    if (!selectedClienteId) return { success: false, error: "Selecciona un cliente" }
    if (!formData.montaje) return { success: false, error: "Selecciona un montaje antes de crear la cotización." }

    setLoading(true)
    try {
      const formDataToSubmit = new FormData()

      formDataToSubmit.append("nombreevento", formData.nombreEvento)
      formDataToSubmit.append("hotelid", formData.hotel)
      formDataToSubmit.append("salonid", formData.salon)
      formDataToSubmit.append("montajeid", formData.montaje)
      formDataToSubmit.append("fechainicio", formData.fechaInicial)
      formDataToSubmit.append("fechafin", formData.fechaFinal)
      formDataToSubmit.append("numeroinvitados", formData.numeroInvitados)
      formDataToSubmit.append("adultos", formData.adultos)
      formDataToSubmit.append("ninos", formData.ninos)
      formDataToSubmit.append("tipoevento", formData.tipoEvento)
      formDataToSubmit.append("totalmonto", formData.totalMonto)
      formDataToSubmit.append("horainicio", formData.horaInicio)
      formDataToSubmit.append("horafin", formData.horaFin)
      formDataToSubmit.append("horapremontaje", formData.horaPreMontaje)
      formDataToSubmit.append("horapostmontaje", formData.horaPostMontaje)
      formDataToSubmit.append("horasextras", formData.horasExtras)
      formDataToSubmit.append("subtotal", formData.subtotal)
      formDataToSubmit.append("impuestos", formData.impuestos)
      formDataToSubmit.append("porcentajedescuento", formData.descuentoPorcentaje)
      formDataToSubmit.append("montodescuento", formData.montoDescuento)
      formDataToSubmit.append("estatusid", formData.estatusId)
      formDataToSubmit.append("categoriaevento", formData.categoriaEvento)
      formDataToSubmit.append("clienteid", selectedClienteId)
      formDataToSubmit.append("numerohabitaciones", requerirHabitaciones ? formData.numeroHabitaciones : "")
      formDataToSubmit.append("hospedajefechainicio", requerirHabitaciones ? formData.hospedajeFechaInicio : "")
      formDataToSubmit.append("hospedajefechafin", requerirHabitaciones ? formData.hospedajeFechaFin : "")

      const editId = effectiveEditId
      // existingId debe ser SIEMPRE el eventoid (eventos.id), no el reservacionid.
      // cotizacionId representa la reservación activa (eventoxreservaciones.id), así que usamos eventoId.
      const existingId = editId || eventoId?.toString()

      let result
      if (existingId) {
        formDataToSubmit.append("id", existingId)
        formDataToSubmit.append("fechaactualizacion", new Date().toISOString().slice(0, 10))
        formDataToSubmit.append("impuestos", formData.impuestos)
        formDataToSubmit.append("porcentajedescuento", formData.descuentoPorcentaje)
        formDataToSubmit.append("montodescuento", formData.montoDescuento)
        result = await actualizarCotizacion(formDataToSubmit)
        if (result.success) {
          // Persistir cambios de cada reservación (tab) en eventoxreservaciones
          // Snapshot actual (tab activa) + snapshots en memoria para el resto
          const snapshotActivo = captureCurrentTabSnapshot()
          const errores: string[] = []
          for (let idx = 0; idx < reservacionTabs.length; idx++) {
            const tab = reservacionTabs[idx]
            if (!tab.id) continue
            const snap = idx === activeReservacionIdx ? snapshotActivo : tabSnapshotsRef.current[idx]
            if (!snap) continue
            const fd = snap.formData
            const res = await actualizarReservacion(tab.id, {
              salonid: fd.salon || null,
              montajeid: fd.montaje || null,
              fechainicio: fd.fechaInicial || null,
              fechafin: fd.fechaFinal || null,
              horainicio: fd.horaInicio || null,
              horafin: fd.horaFin || null,
              horapremontaje: fd.horaPreMontaje || null,
              horapostmontaje: fd.horaPostMontaje || null,
              horasextras: fd.horasExtras || 0,
              nombreevento: fd.nombreEvento || null,
              tipoevento: formData.tipoEvento ? Number(formData.tipoEvento) : null,
              adultos: fd.adultos || null,
              ninos: fd.ninos || null,
              numeroinvitados: fd.numeroInvitados || null,
            })
            if (!res.success) errores.push(`${tab.label}: ${res.error}`)
          }
          // Actualizar baseline de cada tab — lo que se guardó ahora es la nueva referencia
          for (let idx = 0; idx < reservacionTabs.length; idx++) {
            const snap = idx === activeReservacionIdx ? snapshotActivo : tabSnapshotsRef.current[idx]
            if (snap) lastSavedTabSnapshotsRef.current[idx] = snap
          }
          if (errores.length > 0) return { success: false, error: `Errores en reservaciones:\n${errores.join("\n")}` }
          return { success: true, created: false }
        } else {
          return { success: false, error: result.error }
        }
      } else {
        result = await crearCotizacion(formDataToSubmit)
        if (result.success) {
          // Nota: cotizacionId ahora almacena el reservacionid (eventoxreservaciones.id)
          // ya que elementosxcotizacion y las operaciones de paquete se atan a la reservación.
          const resvId = (result as any).reservacionid ?? result.data
          setEventoId(result.data)
          setCotizacionId(resvId)
          // Etiquetar la tab actual con el reservacionid recién creado
          setReservacionTabs(prev => prev.map((t, i) => i === activeReservacionIdx ? { ...t, id: resvId } : t))
          setShowPackageSection(true)
          cargarAudiovisualItems(resvId)
          cargarComplementoItems(resvId)
          // Agregar salón al presupuesto
          if (formData.salon) {
            const salonItem = salones.find((s) => s.value === formData.salon)
            const salonResult = await objetoSalon(Number(formData.salon))
            const precioSalon = salonResult.success && salonResult.data?.preciopordia ? Number(salonResult.data.preciopordia) : 0
            const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
            setPresupuestoItems([crearPresupuestoItem(salonItem?.text || "Salón", "Salón", precioSalon, dias, 0, 1)])
          }
          // Baseline inicial tras crear
          lastSavedTabSnapshotsRef.current[activeReservacionIdx] = captureCurrentTabSnapshot()
          return { success: true, created: true }
        } else {
          return { success: false, error: result.error }
        }
      }
    } catch (error) {
      console.error("Error al guardar cotización:", error)
      const msg = error instanceof Error ? error.message : "Error inesperado al guardar la cotización"
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (readOnly) return
    const res = await saveCotizacion()
    if (res.success) setSuccessModal({ open: true, created: !!res.created })
    else if (res.error) alert(`Error al guardar cotización: ${res.error}`)
  }

  // Convierte un Date a "YYYY-MM-DD" usando hora local (evita desfase UTC)
  function toLocalDateStr(date: Date): string {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  // Devuelve el conjunto de índices bloqueados en HORARIOS_EVENTO para una fecha dada
  function getBlockedIndices(dateStr: string): Set<number> {
    const blocked = new Set<number>()
    for (const res of salonReservaciones) {
      // Normalizar fechas a YYYY-MM-DD (Supabase puede devolver con timezone)
      const resStart = res.fechainicio.slice(0, 10)
      const resEnd = res.fechafin.slice(0, 10)
      if (dateStr >= resStart && dateStr <= resEnd) {
        // Normalizar horas a HH:MM (Supabase devuelve HH:MM:SS)
        const horainicio = res.horainicio?.slice(0, 5) ?? ""
        const horafin = res.horafin?.slice(0, 5) ?? ""
        const startIdx = HORARIOS_EVENTO.findIndex((h) => h.value === horainicio)
        const endIdx = HORARIOS_EVENTO.findIndex((h) => h.value === horafin)
        if (startIdx >= 0 && endIdx >= 0) {
          // Bloquear rango + 2 slots de buffer (1 hora)
          const bufferEnd = Math.min(endIdx + 2, HORARIOS_EVENTO.length - 1)
          for (let i = startIdx; i <= bufferEnd; i++) blocked.add(i)
        }
      }
    }
    return blocked
  }

  // Unión de horas bloqueadas para todo el rango de fechas seleccionado
  function getBlockedIndicesForRange(): Set<number> {
    const blocked = new Set<number>()
    if (!formData.fechaInicial || salonReservaciones.length === 0) return blocked
    const start = new Date(formData.fechaInicial + "T12:00:00")
    const end = formData.fechaFinal ? new Date(formData.fechaFinal + "T12:00:00") : start
    const current = new Date(start)
    while (current <= end) {
      getBlockedIndices(toLocalDateStr(current)).forEach((i) => blocked.add(i))
      current.setDate(current.getDate() + 1)
    }
    return blocked
  }

  // Un día está completamente bloqueado si todos los slots están ocupados
  function isDayFullyBooked(date: Date): boolean {
    if (!formData.salon || salonReservaciones.length === 0) return false
    return getBlockedIndices(toLocalDateStr(date)).size >= HORARIOS_EVENTO.length
  }

  const blockedIndices = getBlockedIndicesForRange()
  const horaInicioIdx = HORARIOS_EVENTO.findIndex((h) => h.value === formData.horaInicio)

  return (
    <>
    {/* Pantalla de carga al editar cotización */}
    {loadingEdit && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-300">
          {/* Animated SPARK logo */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#1a3d2e]/10 animate-ping" />
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
              <img src="/spark-icon.svg" alt="SPARK" className="h-9 w-9" />
            </div>
          </div>

          {/* Spinner */}
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 border-[3px] border-[#1a3d2e]/20 border-t-[#1a3d2e] rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">Cargando cotizacion</span>
          </div>

          {/* Step indicator */}
          <p className="text-xs text-gray-400 animate-pulse">{loadingEditStep}</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#1a3d2e] to-[#4ade80] rounded-full animate-[loading-bar_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset disabled={readOnly} className="contents">
      {renderReservacionTabs()}

      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Selección de Espacio</CardTitle>
          </div>
          <CardDescription>Elige el hotel, salón, tipo de montaje y datos del cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">

          {/* Client Information */}
          <div className="pb-3">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Información del Cliente</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-2 relative">
                <Label htmlFor="nombreCliente" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre del Cliente <span className="text-red-500">*</span>
                  <span className="relative inline-flex group/tip">
                    <span
                      tabIndex={0}
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px] font-bold cursor-help shadow-sm ring-1 ring-blue-700/20 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label="Ayuda sobre búsqueda de cliente"
                    >
                      ?
                    </span>
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-30 w-64 opacity-0 translate-y-1 group-hover/tip:opacity-100 group-hover/tip:translate-y-0 group-focus-within/tip:opacity-100 group-focus-within/tip:translate-y-0 transition-all duration-150"
                    >
                      <span className="block rounded-lg bg-slate-900 text-white text-xs font-normal leading-relaxed px-3 py-2 shadow-xl ring-1 ring-black/5">
                        <span className="block font-semibold text-blue-200 mb-0.5">Búsqueda flexible</span>
                        Puedes buscar al cliente escribiendo su <span className="font-semibold text-white">nombre</span>, <span className="font-semibold text-white">email</span> o <span className="font-semibold text-white">teléfono</span>.
                      </span>
                      <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900 ring-1 ring-black/5" />
                    </span>
                  </span>
                </Label>
                <Input
                  id="nombreCliente"
                  type="text"
                  value={formData.nombreCliente}
                  onChange={(e) => handleClienteInputChange(e.target.value)}
                  onFocus={() => {
                    if (filteredClientes.length > 0) setShowClienteDropdown(true)
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowClienteDropdown(false), 200)
                  }}
                  placeholder="Escribe para buscar cliente..."
                  className={`border-blue-200 focus:ring-blue-500 ${formData.nombreCliente && !selectedClienteId ? "border-red-400 focus:ring-red-400" : ""}`}
                  autoComplete="off"
                />
                {formData.nombreCliente && !selectedClienteId && !showClienteDropdown && (
                  <div className="flex items-start gap-2 mt-1">
                    <p className="text-xs text-red-500 leading-tight line-clamp-2">Cliente no encontrado en contactos, regístralo haciendo clic aquí →</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNuevoClienteModal(true)}
                      className="h-6 text-[11px] gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 flex-shrink-0"
                    >
                      <UserPlus className="h-3 w-3" />
                      Registrar
                    </Button>
                  </div>
                )}
                {showClienteDropdown && filteredClientes.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-blue-300 rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-[480px]">
                    {filteredClientes.map((cliente) => (
                      <button
                        key={cliente.value}
                        type="button"
                        onClick={() => handleClienteSelect(cliente)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-blue-100 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-gray-800">{cliente.text}</div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {cliente.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-blue-400" />{cliente.email}
                            </span>
                          )}
                          {cliente.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-blue-400" />{cliente.telefono}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  placeholder="Se completa al seleccionar cliente"
                  className="border-blue-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  placeholder="Se completa al seleccionar cliente"
                  className="border-blue-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>

              {categoriasEvento.find(c => c.id.toString() === formData.categoriaEvento)?.nombre?.toUpperCase() === "EMPRESARIAL" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="empresa" className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Empresa
                    </Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      placeholder="Se completa al seleccionar cliente"
                      className="border-blue-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grupo" className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Grupo (Empresa Principal)
                    </Label>
                    <Input
                      id="grupo"
                      value={formData.grupo}
                      placeholder="Se completa al seleccionar cliente"
                      className="border-blue-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled
                      readOnly
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Categoría, Tipo de Evento, No. Invitados */}
          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Datos del Evento</h3>
            <div className="flex flex-wrap gap-5">
              <div className="space-y-1 w-48">
                <Label htmlFor="categoriaEvento" className="text-xs font-medium">
                  Categoría del Evento
                </Label>
                <Select
                  value={formData.categoriaEvento}
                  onValueChange={(v) => {
                    const cat = categoriasEvento.find(c => c.id.toString() === v)
                    setFormData(prev => ({ ...prev, categoriaEvento: v, tipoEvento: "" }))
                    setTiposEvento([])
                    loadTiposEvento(v)
                  }}
                >
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm w-full">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasEvento.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-48">
                <Label htmlFor="tipoEvento" className="text-xs font-medium">
                  Tipo de Evento <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.tipoEvento} onValueChange={handleTipoEventoChange} disabled={!formData.categoriaEvento} required>
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm w-full">
                    <SelectValue placeholder={formData.categoriaEvento ? "Selecciona tipo" : "Selecciona categoría primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEvento.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.text}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-28">
                <Label htmlFor="adultos" className="text-xs font-medium">
                  Adultos
                </Label>
                <Input
                  id="adultos"
                  type="number"
                  min="0"
                  max="999"
                  value={formData.adultos}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 3)
                    const adultos = Number(val) || 0
                    const ninos = Number(formData.ninos) || 0
                    const total = adultos + ninos
                    setFormData(prev => ({ ...prev, adultos: val, numeroInvitados: total.toString() }))
                    setPresupuestoItems(prev => prev.map(p =>
                      p.tipo === "Paquete" || p.tipo === "Complemento"
                        ? { ...p, cantidad: total, total: (p.subtotal + (p.servicio || 0)) * total * (p.dias || 1) }
                        : p
                    ))
                  }}
                  placeholder="0"
                  className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                />
              </div>

              <div className="space-y-1 w-28">
                <Label htmlFor="ninos" className="text-xs font-medium">
                  Niños
                </Label>
                <Input
                  id="ninos"
                  type="number"
                  min="0"
                  max="999"
                  value={formData.ninos}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 3)
                    const ninos = Number(val) || 0
                    const adultos = Number(formData.adultos) || 0
                    const total = adultos + ninos
                    setFormData(prev => ({ ...prev, ninos: val, numeroInvitados: total.toString() }))
                    setPresupuestoItems(prev => prev.map(p =>
                      p.tipo === "Paquete" || p.tipo === "Complemento"
                        ? { ...p, cantidad: total, total: (p.subtotal + (p.servicio || 0)) * total * (p.dias || 1) }
                        : p
                    ))
                  }}
                  placeholder="0"
                  className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                />
              </div>

              <div className="space-y-1 w-36">
                <Label htmlFor="numeroInvitados" className="text-xs font-medium">
                  No. Invitados <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numeroInvitados"
                  type="number"
                  value={formData.numeroInvitados}
                  placeholder="0"
                  className="border-blue-200 focus:ring-blue-500 h-8 text-sm bg-gray-50"
                  disabled
                  required
                />
              </div>

            </div>

            <div className="mt-3">
              <div className="space-y-1 w-64">
                <Label htmlFor="nombreEvento" className="text-xs font-medium">
                  Nombre del Evento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombreEvento"
                  type="text"
                  value={formData.nombreEvento}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombreEvento: e.target.value }))}
                  placeholder="Ej: Boda de Juan y María"
                  className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Selección de Espacio y Fechas */}
          <div className="border-t pt-3 space-y-3">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Selección de Espacio</h3>

            {/* Hotel */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Hotel <span className="text-red-500">*</span></Label>
              <Select
                value={formData.hotel}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, hotel: value, salon: "", montaje: "" }))
                  setSalones([])
                  setMontajes([])
                  setSalonFotos([])
                  setCurrentPhotoIndex(0)
                  setSalonReservaciones([])
                  loadSalones(value)
                }}
                required
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm">
                  <SelectValue placeholder="Selecciona un hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>{hotel.text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Calendario de Disponibilidad — full width */}
            <AvailabilityCalendar
              key={`resv-${activeReservacionIdx}-${reservacionTabs[activeReservacionIdx]?.id ?? "new"}`}
              hotelId={formData.hotel}
              salones={salones}
              onSelectSlot={async (fecha, salonId, horaPreMontaje, horaInicio, horaFin, horaPostMontaje, horasExtras, fechaFin2, overlappingCotizacion) => {
                setOverlapWarning(overlappingCotizacion || null)
                const prevSalon = formData.salon
                setFormData(prev => ({
                  ...prev,
                  // Solo actualizar fechas si viene fecha (selección de día), no cuando solo cambian horas
                  ...(fecha ? { fechaInicial: fecha, fechaFinal: fechaFin2 || fecha } : {}),
                  ...(salonId ? { salon: salonId } : {}),
                  ...(horaPreMontaje !== undefined ? { horaPreMontaje } : {}),
                  ...(horaInicio !== undefined ? { horaInicio } : {}),
                  ...(horaFin !== undefined ? { horaFin } : {}),
                  ...(horaPostMontaje !== undefined ? { horaPostMontaje } : {}),
                  horasExtras: (horasExtras ?? 0).toString(),
                }))
                if (fecha) {
                  setCalendarRange({ from: new Date(fecha + "T00:00:00"), to: new Date((fechaFin2 || fecha) + "T00:00:00") })
                }
                // Solo recargar montajes/reservaciones/presupuesto cuando cambia el salón
                if (salonId !== prevSalon) {
                  setFormData(prev => ({ ...prev, montaje: "" }))
                  setMontajes([])
                  setSalonReservaciones([])
                  setReservacionesDia([])
                  await loadMontajes(salonId)
                  const salonItem = salones.find((s) => s.value === salonId)
                  const salonResult = await objetoSalon(Number(salonId))
                  const precioSalon = salonResult.success && salonResult.data?.preciopordia ? Number(salonResult.data.preciopordia) : 0
                  const nombreSalon = salonResult.success && salonResult.data?.nombre ? salonResult.data.nombre : salonItem?.text || "Salón"
                  setPresupuestoItems(prev => {
                    const sinSalon = prev.filter(p => p.tipo !== "Salón")
                    return [crearPresupuestoItem(nombreSalon, "Salón", precioSalon, 1, 0, 1), ...sinSalon]
                  })
                }
              }}
              selectedFechaInicio={formData.fechaInicial}
              selectedFechaFin={formData.fechaFinal}
              selectedSalonId={formData.salon}
              selectedHoraPreMontaje={formData.horaPreMontaje}
              selectedHoraInicio={formData.horaInicio}
              selectedHoraFin={formData.horaFin}
              selectedHoraPostMontaje={formData.horaPostMontaje}
              draftReservaciones={reservacionTabs.map((tab, idx) => {
                if (idx === activeReservacionIdx) return null
                const snap = tabSnapshotsRef.current[idx]
                if (!snap?.formData) return null
                const fd = snap.formData
                if (!fd.salon || !fd.fechaInicial || !fd.horaInicio || !fd.horaFin) return null
                return {
                  salonid: fd.salon,
                  fechainicio: fd.fechaInicial,
                  fechafin: fd.fechaFinal || fd.fechaInicial,
                  horainicio: fd.horaInicio,
                  horafin: fd.horaFin,
                  horapremontaje: fd.horaPreMontaje,
                  horapostmontaje: fd.horaPostMontaje,
                  label: tab.label,
                }
              }).filter(Boolean) as any[]}
              initialViewMode={formData.fechaInicial ? "day" : (searchParams.get("fechaInicio") ? "day" : undefined)}
              initialDate={formData.fechaInicial || searchParams.get("fechaInicio") || undefined}
              excludeMatch={(() => {
                // Usar baseline del último guardado para que la exclusión no se pierda cuando el usuario arrastra.
                // El calendario ahora mapea horainicio = horapremontaje para los eventos cargados,
                // así que matcheamos contra horaPreMontaje (o horaInicio si no hay pre).
                const baseline = lastSavedTabSnapshotsRef.current[activeReservacionIdx]?.formData
                if (!eventoId || !baseline) return undefined
                return {
                  eventoid: eventoId,
                  salonid: baseline.salon || undefined,
                  fechainicio: baseline.fechaInicial || undefined,
                  horainicio: baseline.horaPreMontaje || baseline.horaInicio || undefined,
                }
              })()}
            />

            {/* Salón, Montaje, Fechas, Horarios + Galería */}
            <div className="grid md:grid-cols-[1fr_380px] gap-3">
              {/* Izquierda: inputs */}
              <div className="space-y-2">
                {/* Salón + Montaje */}
                <div className="flex gap-2 items-end bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <div className="space-y-1 w-[220px]">
                    <Label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">Salón <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.salon}
                      onValueChange={async (value) => {
                        setFormData(prev => ({ ...prev, salon: value, montaje: "" }))
                        setMontajes([])
                        setSalonReservaciones([])
                        setReservacionesDia([])
                        await loadMontajes(value)
                        if (diaSeleccionado) {
                          setLoadingResDia(true)
                          obtenerReservacionesPorDia(diaSeleccionado, Number(value)).then((res) => {
                            setReservacionesDia(res.data ?? [])
                            setLoadingResDia(false)
                          })
                        }
                        const salonItem = salones.find((s) => s.value === value)
                        const salonResult = await objetoSalon(Number(value))
                        const precioSalon = salonResult.success && salonResult.data?.preciopordia ? Number(salonResult.data.preciopordia) : 0
                        const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
                        const nombreSalon = salonResult.success && salonResult.data?.nombre ? salonResult.data.nombre : salonItem?.text || "Salón"
                        setPresupuestoItems(prev => {
                          const sinSalon = prev.filter(p => p.tipo !== "Salón")
                          return [crearPresupuestoItem(nombreSalon, "Salón", precioSalon, dias, 0, 1), ...sinSalon]
                        })
                      }}
                      disabled={!formData.hotel}
                      required
                    >
                      <SelectTrigger className="border-slate-300 bg-white focus:ring-blue-500 h-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <SelectValue placeholder={formData.hotel ? "Selecciona un salón" : "Selecciona hotel primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {salones.map((salon) => (
                          <SelectItem key={salon.value} value={salon.value}>{salon.text}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-[220px]">
                    <Label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">Montaje <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.montaje}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, montaje: value }))}
                      disabled={!formData.salon}
                      required
                    >
                      <SelectTrigger className="border-slate-300 bg-white focus:ring-blue-500 h-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <SelectValue placeholder={formData.salon ? "Selecciona un montaje" : "Selecciona salón primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {montajes.map((montaje) => (
                          <SelectItem key={montaje.value} value={montaje.value}>{montaje.text}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Fecha Inicio <span className="text-red-500">*</span></Label>
                    <Input id="fechaInicial" type="date" value={formData.fechaInicial}
                      onChange={(e) => { setFormData(prev => ({ ...prev, fechaInicial: e.target.value })); if (e.target.value) setCalendarRange((prev) => ({ from: new Date(e.target.value + "T00:00:00"), to: prev?.to })) }}
                      className="border-blue-200 focus:ring-blue-500 h-8 text-sm" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Fecha Fin <span className="text-red-500">*</span></Label>
                    <Input id="fechaFinal" type="date" value={formData.fechaFinal}
                      onChange={(e) => { setFormData(prev => ({ ...prev, fechaFinal: e.target.value })); if (e.target.value) setCalendarRange((prev) => ({ from: prev?.from, to: new Date(e.target.value + "T00:00:00") })) }}
                      className="border-blue-200 focus:ring-blue-500 h-8 text-sm" required />
                  </div>
                </div>

                {/* Horarios */}
                <div className="flex gap-1.5 items-end flex-wrap">
                  <div className="space-y-1 w-[105px]">
                    <Label className="text-[10px] font-semibold text-purple-900 uppercase tracking-wide">PreMontaje</Label>
                    <Input type="text" value={formData.horaPreMontaje ? HORARIOS_EVENTO.find(h => h.value === formData.horaPreMontaje)?.label || formData.horaPreMontaje : "—"}
                      className="border-purple-200 bg-purple-50/50 text-purple-800 h-7 text-xs cursor-not-allowed text-center" disabled readOnly />
                  </div>
                  <div className="space-y-1 w-[120px]">
                    <Label className="text-[10px] font-semibold text-blue-900 uppercase tracking-wide">Hora Inicio <span className="text-red-500">*</span></Label>
                    <Select value={formData.horaInicio} onValueChange={(value) => setFormData(prev => ({ ...prev, horaInicio: value }))} required>
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-7 text-xs"><SelectValue placeholder="Hora" /></SelectTrigger>
                      <SelectContent>{HORARIOS_EVENTO.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-[120px]">
                    <Label className="text-[10px] font-semibold text-blue-900 uppercase tracking-wide">Hora Fin <span className="text-red-500">*</span></Label>
                    <Select value={formData.horaFin} onValueChange={(value) => setFormData(prev => ({ ...prev, horaFin: value }))} required>
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-7 text-xs"><SelectValue placeholder="Hora" /></SelectTrigger>
                      <SelectContent>{HORARIOS_EVENTO.map((h, idx) => { const d = horaInicioIdx >= 0 && idx <= horaInicioIdx; return <SelectItem key={h.value} value={h.value} disabled={d}>{h.label}</SelectItem> })}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-[105px]">
                    <Label className="text-[10px] font-semibold text-purple-900 uppercase tracking-wide">PostMontaje</Label>
                    <Input type="text" value={formData.horaPostMontaje ? HORARIOS_EVENTO.find(h => h.value === formData.horaPostMontaje)?.label || formData.horaPostMontaje : "—"}
                      className="border-purple-200 bg-purple-50/50 text-purple-800 h-7 text-xs cursor-not-allowed text-center" disabled readOnly />
                  </div>
                  <div className="space-y-1 w-[75px]">
                    <Label className="text-[10px] font-semibold text-teal-900 uppercase tracking-wide">Extras</Label>
                    <Input type="text" value={Number(formData.horasExtras) > 0 ? `${formData.horasExtras} hr` : "0"}
                      className="border-teal-200 bg-teal-50/50 text-teal-800 h-7 text-xs cursor-not-allowed font-semibold text-center" disabled readOnly />
                  </div>
                </div>

                {/* Warning de solapamiento */}
                {overlapWarning && (
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-300 rounded-lg px-3 py-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-orange-500 flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    <div>
                      <p className="text-[10px] font-bold text-orange-800">{overlapWarning}</p>
                      <p className="text-[9px] text-orange-600">Se requiere autorización especial para confirmar esta cotización.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Derecha: Galería de fotos del salón */}
              <div className="relative rounded-xl overflow-hidden bg-blue-50 border border-blue-100 flex flex-col">
                {formData.salon && salonFotos.length > 0 ? (
                  <>
                    <div className="relative flex-1 overflow-hidden group min-h-[180px]">
                      <img
                        src={salonFotos[currentPhotoIndex]}
                        alt={`Foto ${currentPhotoIndex + 1} del salón`}
                        className="absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                        onClick={() => setShowPhotoModal(true)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {salonFotos.map((_, i) => (
                          <button key={i} type="button" onClick={() => setCurrentPhotoIndex(i)}
                            className={`h-1.5 rounded-full transition-all ${i === currentPhotoIndex ? "bg-white w-4" : "bg-white/50 w-1.5"}`} />
                        ))}
                      </div>
                      {salonFotos.length > 1 && (
                        <>
                          <button type="button" onClick={() => setCurrentPhotoIndex((p) => (p === 0 ? salonFotos.length - 1 : p - 1))} className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center z-10">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-blue-700"><polyline points="15 18 9 12 15 6" /></svg>
                          </button>
                          <button type="button" onClick={() => setCurrentPhotoIndex((p) => (p === salonFotos.length - 1 ? 0 : p + 1))} className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center z-10">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-blue-700"><polyline points="9 18 15 12 9 6" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                    <div className="px-2 py-1 text-[10px] text-blue-600 font-medium text-center bg-white flex-shrink-0">
                      {currentPhotoIndex + 1} / {salonFotos.length} fotos
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 gap-2 p-4 text-center min-h-[180px]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-blue-200">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p className="text-xs text-blue-300">
                      {!formData.hotel ? "Selecciona hotel" : !formData.salon ? "Selecciona salón" : "Sin fotos"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Información del Evento</h3>
            <div className="flex flex-wrap gap-5">
              <div className="space-y-1 w-48">
                <Label htmlFor="estatus" className="text-xs font-medium">
                  Estatus
                </Label>
                <Select
                  value={formData.estatusId}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, estatusId: v }))}
                  disabled={!effectiveEditId && !cotizacionId}
                >
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm w-full">
                    <SelectValue placeholder="Selecciona estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    {estatusList.map((e) => (
                      <SelectItem key={e.value} value={e.value}>{e.text}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkbox Requerimiento de Habitaciones */}
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={requerirHabitaciones}
                  onChange={(e) => {
                    setRequerirHabitaciones(e.target.checked)
                    if (!e.target.checked) {
                      setFormData(prev => ({ ...prev, numeroHabitaciones: "", hospedajeFechaInicio: "", hospedajeFechaFin: "" }))
                    }
                  }}
                  className="w-4 h-4 rounded border-blue-300 text-blue-600 accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Requerimiento de Habitaciones</span>
              </label>

              {requerirHabitaciones && (() => {
                const nombreCategoria = categoriasEvento.find(c => c.id.toString() === formData.categoriaEvento)?.nombre?.toLowerCase() || ""
                const esGrupal = nombreCategoria === "grupal"
                const minHab = esGrupal ? 10 : 1
                const maxHab = esGrupal ? undefined : 9
                const helper = esGrupal ? "Grupal: mínimo 10 habitaciones" : "Máximo 9 habitaciones (use Grupal para más)"
                return (
                <div className="grid grid-cols-3 gap-3 pl-6 border-l-2 border-blue-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Número de Habitaciones</Label>
                    <Input
                      type="number"
                      min={minHab}
                      {...(maxHab !== undefined ? { max: maxHab } : {})}
                      value={formData.numeroHabitaciones}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "") { setFormData(prev => ({ ...prev, numeroHabitaciones: "" })); return }
                        let n = Number(raw)
                        if (isNaN(n)) return
                        if (maxHab !== undefined && n > maxHab) n = maxHab
                        if (n < 0) n = 0
                        setFormData(prev => ({ ...prev, numeroHabitaciones: String(n) }))
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value
                        if (!raw) return
                        const n = Number(raw)
                        if (isNaN(n)) return
                        if (esGrupal && n < 10) {
                          alert("Categoría Grupal: debes registrar 10 habitaciones o más.")
                          setFormData(prev => ({ ...prev, numeroHabitaciones: "10" }))
                        }
                      }}
                      placeholder={esGrupal ? "Ej: 15" : "Ej: 5"}
                      className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                    />
                    <p className="text-[10px] text-blue-700/80">{helper}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Fecha Inicio Hospedaje</Label>
                    <Input
                      type="date"
                      value={formData.hospedajeFechaInicio}
                      onChange={(e) => setFormData(prev => ({ ...prev, hospedajeFechaInicio: e.target.value }))}
                      className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Fecha Fin Hospedaje</Label>
                    <Input
                      type="date"
                      value={formData.hospedajeFechaFin}
                      onChange={(e) => setFormData(prev => ({ ...prev, hospedajeFechaFin: e.target.value }))}
                      className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                    />
                  </div>
                </div>
                )
              })()}
            </div>
          </div>

        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex gap-4 justify-end">
          <Button
            type="submit"
            disabled={loading || !selectedClienteId}
            className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : (effectiveEditId || cotizacionId) ? "Actualizar Cotización" : "Crear Cotización"}
          </Button>
        </div>
      )}

      {showPackageSection && (
        <Card className="shadow-lg mt-4 border border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 text-lg font-semibold">Asignación de Paquete</CardTitle>
              <div className="flex items-center gap-2">
                {elementosPaquete.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLimpiarModal(true)}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    Limpiar Paquete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaqueteModal(true)}
                  disabled={!formData.tipoEvento}
                >
                  Agregar Paquete
                </Button>
              </div>
            </div>
            <CardDescription>
              {!formData.tipoEvento
                ? "Selecciona un Tipo de Evento para poder agregar un paquete."
                : "Haz clic en Agregar Paquete para seleccionar el paquete de esta cotización."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Secciones del paquete — siempre visibles */}
            <div className="bg-[#f7f5f0] rounded-xl p-8">
                {/* Package Title — solo si hay paquete seleccionado */}
                {selectedPaqueteInfo && (
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold tracking-widest text-[#1a3d2e] uppercase">
                      PAQUETE{" "}
                      <span className="font-serif italic font-normal normal-case">
                        {selectedPaqueteInfo?.nombre || selectedPaqueteInfo?.name || ""}
                      </span>
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <div className="h-px w-24 bg-[#1a3d2e]/30" />
                      <div className="h-px w-24 bg-[#1a3d2e]/30" />
                    </div>
                  </div>
                )}

                {/* Group elements by tipoelemento */}
                {(() => {
                  const tipoIconMap: Record<string, React.ReactElement> = {
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
                    beneficios: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    ),
                  }

                  // Inicializar secciones fijas del paquete (aunque estén vacías)
                  const grouped: Record<string, any[]> = {}
                  for (const seccion of seccionesPaquete) {
                    grouped[seccion] = []
                  }
                  // Llenar con elementos actuales
                  for (const el of elementosPaquete) {
                    const key = normalizarSeccion(el.tipoelemento || el.tipo || "otros")
                    if (!grouped[key]) grouped[key] = []
                    grouped[key].push(el)
                  }

                  // "platillos" y "consumo" se renderizan como subsecciones (de "alimentos" y "bebidas"), no como grupo top-level
                  const grupos = Object.entries(grouped).filter(([tipo]) => tipo !== "platillos" && tipo !== "consumo")
                  const mitad = Math.ceil(grupos.length / 2)
                  const leftGroups = grupos.slice(0, mitad)
                  const rightGroups = grupos.slice(mitad)

                  const renderGroup = (tipo: string, items: any[], isLast: boolean) => {
                    const iconKey = tipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(" ")[0]
                    const icon = tipoIconMap[iconKey] || tipoIconMap["servicio"]
                    return (
                      <div key={tipo} className={!isLast ? "border-b border-[#1a3d2e]/20 pb-5" : ""}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 flex items-center justify-center text-[#1a3d2e]">{icon}</div>
                          <h3 className="text-sm font-bold tracking-widest text-[#1a3d2e] uppercase">{tipo}</h3>
                        </div>
                        <div className="pl-11 space-y-1">
                          {tipo === "lugar" && (() => {
                            const nombreSalon = salones.find(s => s.value === formData.salon)?.text || ""
                            const toMin = (h: string) => {
                              const [hh, mm] = (h || "").split(":").map(Number)
                              return (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm)
                            }
                            const ini = toMin(formData.horaInicio)
                            const fin = toMin(formData.horaFin)
                            let diff = fin - ini
                            if (diff < 0) diff += 24 * 60
                            const horasBase = diff / 60
                            const horasExtras = Number(formData.horasExtras) || 0
                            const totalHoras = horasBase + horasExtras
                            const fmt = (n: number) => Number.isInteger(n) ? n.toString() : n.toFixed(1)
                            return (
                              <div className="space-y-0.5 mb-1">
                                {nombreSalon && (
                                  <p className="text-sm text-[#1a3d2e]">
                                    <span className="font-semibold">Salón:</span> {nombreSalon}
                                  </p>
                                )}
                                {(formData.horaInicio && formData.horaFin) && (
                                  <p className="text-sm text-[#1a3d2e]">
                                    <span className="font-semibold">Salon por hasta:</span> {fmt(totalHoras)} hrs
                                    {horasExtras > 0 && (
                                      <span className="text-gray-500"> ({fmt(horasBase)} + {fmt(horasExtras)} extra)</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            )
                          })()}
                          {(tipo === "lugar" || tipo === "alimentos" || tipo === "bebidas" ? [] : items).map((item, i) => {
                            const itemNombre = item.descripcion || item.nombre || item.elemento || ""
                            return (
                              <div key={i} className="flex items-center justify-between gap-2 group">
                                <span className={`text-sm font-semibold ${item.destacado ? "text-[#b87333]" : "text-[#1a3d2e]"} break-words`}>
                                  {itemNombre}
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {item.documentopdf && (
                                    <button
                                      type="button"
                                      onClick={() => handleVerPDF(Number(item.elementoid ?? item.id), tipo)}
                                      className="text-[10px] text-[#1a3d2e] hover:text-[#1a3d2e]/70 underline decoration-dotted"
                                      title="Ver documento PDF"
                                    >
                                      PDF
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEliminarPendiente({ tipoelemento: item.tipoelemento, id: item.elementoid ?? item.id, nombre: itemNombre })
                                      setShowConfirmEliminarModal(true)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded"
                                    title="Eliminar elemento"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path d="M19 6l-1 14H6L5 6"/>
                                      <path d="M10 11v6M14 11v6"/>
                                      <path d="M9 6V4h6v2"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                          {tipo !== "lugar" && tipo !== "alimentos" && tipo !== "bebidas" && (
                            <button
                              type="button"
                              onClick={() => handleAbrirAgregar(tipo)}
                              className="mt-2 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                              Agregar
                            </button>
                          )}
                        </div>

                        {/* Alimentos: cada menú es una fila expandible con sus propios platillos */}
                        {tipo === "alimentos" && (
                          <div className="pl-11 space-y-2 mt-1">
                            {items.map((alimento: any) => {
                              const alimId = Number(alimento.elementoid ?? alimento.id)
                              const alimNombre = alimento.descripcion || alimento.nombre || alimento.elemento || ""
                              const tipoMenu = alimentosTipoMenu[alimId] || ""
                              const isCompleto = tipoMenu.toLowerCase() === "completo"
                              // "Es menú" si tiene tipomenu marcado O si tiene platillos en la tabla platillos
                              const hasMenu = !!tipoMenu || alimentosConPlatillos[alimId] === true
                              const isExpanded = hasMenu && expandedAlimentos.has(alimId)
                              const misPlatillos = platillosItems.filter((p: any) => Number(p.platilloid) === alimId)
                              const sinPlatillos = hasMenu && misPlatillos.length === 0
                              const toggleExpand = () => {
                                if (!hasMenu) return
                                setExpandedAlimentos(prev => {
                                  const next = new Set(prev)
                                  if (next.has(alimId)) next.delete(alimId); else next.add(alimId)
                                  return next
                                })
                              }
                              return (
                                <div key={alimId} className={`border rounded-lg overflow-hidden ${sinPlatillos ? "border-amber-300/60" : "border-[#1a3d2e]/15"}`}>
                                  <div className={`flex items-center justify-between gap-2 group px-3 py-2 ${sinPlatillos ? "bg-amber-50" : "bg-[#1a3d2e]/5"}`}>
                                    {hasMenu ? (
                                      <button
                                        type="button"
                                        onClick={toggleExpand}
                                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-[#1a3d2e] transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
                                          <polyline points="9 18 15 12 9 6"/>
                                        </svg>
                                        <span
                                          className={`text-sm font-semibold ${alimento.destacado ? "text-[#b87333]" : "text-[#1a3d2e]"} break-words`}
                                        >
                                          {alimNombre}
                                        </span>
                                        {tipoMenu && (
                                          <span className="text-[10px] uppercase tracking-wide text-gray-500 font-normal flex-shrink-0">· {tipoMenu}</span>
                                        )}
                                        {sinPlatillos && (
                                          <span className="text-[10px] text-amber-600 font-medium flex-shrink-0">· Sin platillos</span>
                                        )}
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span
                                          className={`text-sm font-semibold ${alimento.destacado ? "text-[#b87333]" : "text-[#1a3d2e]"} break-words`}
                                        >
                                          {alimNombre}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {alimento.documentopdf && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleVerPDF(alimId, "alimentos") }}
                                          className="text-[10px] text-[#1a3d2e] hover:text-[#1a3d2e]/70 underline decoration-dotted"
                                          title="Ver documento PDF"
                                        >
                                          PDF
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEliminarPendiente({ tipoelemento: alimento.tipoelemento, id: alimId, nombre: alimNombre })
                                          setShowConfirmEliminarModal(true)
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded"
                                        title="Eliminar menú"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                          <polyline points="3 6 5 6 21 6"/>
                                          <path d="M19 6l-1 14H6L5 6"/>
                                          <path d="M10 11v6M14 11v6"/>
                                          <path d="M9 6V4h6v2"/>
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  {isExpanded && (
                                    <div className="px-3 py-2 space-y-3 bg-white">
                                      {isCompleto ? (
                                        ([
                                          { label: "Entradas", tipoFiltro: "ENTRADAS" },
                                          { label: "Plato Fuerte", tipoFiltro: "PLATO FUERTE" },
                                          { label: "Postres", tipoFiltro: "POSTRES" },
                                        ] as const).map(({ label, tipoFiltro }) => {
                                          const platillosFiltrados = misPlatillos.filter((item: any) => (item.tipo || "").toUpperCase() === tipoFiltro)
                                          return (
                                            <div key={tipoFiltro} className="border-l-2 border-[#1a3d2e]/15 pl-3">
                                              <h4 className="text-[11px] font-bold tracking-widest text-[#1a3d2e] uppercase mb-1">{label}</h4>
                                              <div className="space-y-1">
                                                {platillosFiltrados.map((item: any, i: number) => (
                                                  <div key={i} className="flex items-center justify-between gap-2 group/pla">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleAbrirPlatillosModal(tipoFiltro as PlatilloTipo, alimId)}
                                                      className={`text-sm text-left underline decoration-dotted cursor-pointer break-words ${item.destacado ? "text-[#b87333] hover:text-[#b87333]/70" : "text-[#1a3d2e] hover:text-[#1a3d2e]/70"}`}
                                                      title={`Editar ${label.toLowerCase()}`}
                                                    >
                                                      {item.nombre || item.descripcion || item.elemento || ""}
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const nombre = item.descripcion || item.nombre || item.elemento || ""
                                                        setEliminarPendiente({ tipoelemento: item.tipoelemento, id: item.elementoid ?? item.id, nombre })
                                                        setShowConfirmEliminarModal(true)
                                                      }}
                                                      className="opacity-0 group-hover/pla:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded flex-shrink-0"
                                                      title="Eliminar platillo"
                                                    >
                                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                        <polyline points="3 6 5 6 21 6"/>
                                                        <path d="M19 6l-1 14H6L5 6"/>
                                                        <path d="M10 11v6M14 11v6"/>
                                                        <path d="M9 6V4h6v2"/>
                                                      </svg>
                                                    </button>
                                                  </div>
                                                ))}
                                                <button
                                                  type="button"
                                                  onClick={() => handleAbrirPlatillosModal(tipoFiltro as PlatilloTipo, alimId)}
                                                  className="mt-1 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors"
                                                >
                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                                  </svg>
                                                  Agregar
                                                </button>
                                              </div>
                                            </div>
                                          )
                                        })
                                      ) : (
                                        <div className="border-l-2 border-[#1a3d2e]/15 pl-3">
                                          <h4 className="text-[11px] font-bold tracking-widest text-[#1a3d2e] uppercase mb-1">Platillos</h4>
                                          <div className="space-y-1">
                                            {misPlatillos.map((item: any, i: number) => (
                                              <div key={i} className="flex items-center justify-between gap-2 group/pla">
                                                <button
                                                  type="button"
                                                  onClick={() => handleAbrirAgregar("platillos", null, alimId)}
                                                  className={`text-sm text-left underline decoration-dotted cursor-pointer break-words ${item.destacado ? "text-[#b87333] hover:text-[#b87333]/70" : "text-[#1a3d2e] hover:text-[#1a3d2e]/70"}`}
                                                  title="Editar platillos"
                                                >
                                                  {item.nombre || item.descripcion || item.elemento || ""}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const nombre = item.descripcion || item.nombre || item.elemento || ""
                                                    setEliminarPendiente({ tipoelemento: item.tipoelemento, id: item.elementoid ?? item.id, nombre })
                                                    setShowConfirmEliminarModal(true)
                                                  }}
                                                  className="opacity-0 group-hover/pla:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded flex-shrink-0"
                                                  title="Eliminar platillo"
                                                >
                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                    <polyline points="3 6 5 6 21 6"/>
                                                    <path d="M19 6l-1 14H6L5 6"/>
                                                    <path d="M10 11v6M14 11v6"/>
                                                    <path d="M9 6V4h6v2"/>
                                                  </svg>
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              type="button"
                                              onClick={() => handleAbrirAgregar("platillos", null, alimId)}
                                              className="mt-1 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors"
                                            >
                                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                                <line x1="12" y1="5" x2="12" y2="19"/>
                                                <line x1="5" y1="12" x2="19" y2="12"/>
                                              </svg>
                                              Agregar
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {/* Agregar otro menú */}
                            <button
                              type="button"
                              onClick={() => handleAbrirAgregar("alimentos")}
                              className="flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                              Agregar menú
                            </button>
                          </div>
                        )}

                        {/* Subsección Platillos antigua (deprecada para alimentos — ahora es per-menú) */}
                        {false && tipo === "alimentos" && selectedPaqueteInfo?.tipopaquete === "Completo" && (
                          <>
                            {([
                              { label: "Entradas", tipoFiltro: "ENTRADAS" },
                              { label: "Plato Fuerte", tipoFiltro: "PLATO FUERTE" },
                              { label: "Postres", tipoFiltro: "POSTRES" },
                            ] as const).map(({ label, tipoFiltro }) => {
                              const itemsFiltrados = platillosItems.filter((item: any) => item.tipo === tipoFiltro)
                              return (
                                <div key={tipoFiltro} className="mt-4 ml-11 border-l-2 border-[#1a3d2e]/20 pl-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 flex items-center justify-center text-[#1a3d2e]">
                                      {tipoIconMap["platillos"]}
                                    </div>
                                    <h4 className="text-xs font-bold tracking-widest text-[#1a3d2e] uppercase">{label}</h4>
                                  </div>
                                  <div className="space-y-1">
                                    {itemsFiltrados.map((item: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between gap-2 group">
                                        <button
                                          type="button"
                                          onClick={() => handleVerPDF(Number(item.elementoid ?? item.id), "platillos")}
                                          className={`text-sm text-left underline decoration-dotted cursor-pointer ${item.destacado ? "text-[#b87333] hover:text-[#b87333]/70" : "text-[#1a3d2e] hover:text-[#1a3d2e]/70"}`}
                                          title="Ver documento PDF"
                                        >
                                          {item.descripcion || item.nombre || item.elemento || ""}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nombre = item.descripcion || item.nombre || item.elemento || ""
                                            setEliminarPendiente({ tipoelemento: item.tipoelemento, id: item.elementoid ?? item.id, nombre })
                                            setShowConfirmEliminarModal(true)
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded flex-shrink-0"
                                          title="Eliminar elemento"
                                        >
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6l-1 14H6L5 6"/>
                                            <path d="M10 11v6M14 11v6"/>
                                            <path d="M9 6V4h6v2"/>
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                    {(() => {
                                      const alimentoOk = !!elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
                                      return (
                                        <button
                                          type="button"
                                          disabled={!alimentoOk}
                                          onClick={() => handleAbrirPlatillosModal(tipoFiltro as PlatilloTipo)}
                                          title={!alimentoOk ? "Primero selecciona un Alimento (menú)" : undefined}
                                          className="mt-2 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#1a3d2e] disabled:hover:border-[#1a3d2e]/30"
                                        >
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                            <line x1="12" y1="5" x2="12" y2="19"/>
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                          </svg>
                                          Agregar
                                        </button>
                                      )
                                    })()}
                                  </div>
                                </div>
                              )
                            })}
                          </>
                        )}
                        {/* Bebidas: cada menú es una fila expandible con sus bebidas (consumo) */}
                        {tipo === "bebidas" && (
                          <div className="pl-11 space-y-2 mt-1">
                            {items.map((bebida: any) => {
                              const bebId = Number(bebida.elementoid ?? bebida.id)
                              const bebNombre = bebida.descripcion || bebida.nombre || bebida.elemento || ""
                              const tipoMenuBeb = bebidasTipoMenu[bebId] || ""
                              const hasMenu = !!tipoMenuBeb || bebidasConConsumo[bebId] === true
                              const isExpanded = hasMenu && expandedBebidas.has(bebId)
                              const misConsumos = (grouped["consumo"] || []).filter((c: any) => {
                                const parentId = consumoParentMap[Number(c.elementoid ?? c.id)]
                                return parentId === bebId
                              })
                              const sinConsumos = hasMenu && misConsumos.length === 0
                              const toggleExpand = () => {
                                if (!hasMenu) return
                                setExpandedBebidas(prev => {
                                  const next = new Set(prev)
                                  if (next.has(bebId)) next.delete(bebId); else next.add(bebId)
                                  return next
                                })
                              }
                              return (
                                <div key={bebId} className={`border rounded-lg overflow-hidden ${sinConsumos ? "border-amber-300/60" : "border-[#1a3d2e]/15"}`}>
                                  <div className={`flex items-center justify-between gap-2 group px-3 py-2 ${sinConsumos ? "bg-amber-50" : "bg-[#1a3d2e]/5"}`}>
                                    {hasMenu ? (
                                      <button
                                        type="button"
                                        onClick={toggleExpand}
                                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-[#1a3d2e] transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
                                          <polyline points="9 18 15 12 9 6"/>
                                        </svg>
                                        <span className={`text-sm font-semibold ${bebida.destacado ? "text-[#b87333]" : "text-[#1a3d2e]"} break-words`}>
                                          {bebNombre}
                                        </span>
                                        {tipoMenuBeb && (
                                          <span className="text-[10px] uppercase tracking-wide text-gray-500 font-normal flex-shrink-0">· {tipoMenuBeb}</span>
                                        )}
                                        {sinConsumos && (
                                          <span className="text-[10px] text-amber-600 font-medium flex-shrink-0">· Sin bebidas</span>
                                        )}
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className={`text-sm font-semibold ${bebida.destacado ? "text-[#b87333]" : "text-[#1a3d2e]"} break-words`}>
                                          {bebNombre}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {bebida.documentopdf && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleVerPDF(bebId, "bebidas") }}
                                          className="text-[10px] text-[#1a3d2e] hover:text-[#1a3d2e]/70 underline decoration-dotted"
                                          title="Ver documento PDF"
                                        >
                                          PDF
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEliminarPendiente({ tipoelemento: bebida.tipoelemento, id: bebId, nombre: bebNombre })
                                          setShowConfirmEliminarModal(true)
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded"
                                        title="Eliminar"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                          <polyline points="3 6 5 6 21 6"/>
                                          <path d="M19 6l-1 14H6L5 6"/>
                                          <path d="M10 11v6M14 11v6"/>
                                          <path d="M9 6V4h6v2"/>
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  {isExpanded && (
                                    <div className="px-3 py-2 space-y-3 bg-white">
                                      <div className="border-l-2 border-[#1a3d2e]/15 pl-3">
                                        <h4 className="text-[11px] font-bold tracking-widest text-[#1a3d2e] uppercase mb-1">Consumo</h4>
                                        <div className="space-y-1">
                                          {misConsumos.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between gap-2 group/con">
                                              <div className="flex-1 min-w-0">
                                                <button
                                                  type="button"
                                                  onClick={() => handleAbrirAgregar("consumo", null, bebId)}
                                                  className={`text-sm text-left underline decoration-dotted cursor-pointer break-words ${item.destacado ? "text-[#b87333] hover:text-[#b87333]/70" : "text-[#1a3d2e] hover:text-[#1a3d2e]/70"}`}
                                                  title="Editar consumo"
                                                >
                                                  {item.nombre || item.descripcion || item.elemento || ""}
                                                </button>
                                                {item.bebidaprecio && (
                                                  <div className="text-[11px] text-gray-600 mt-0.5">
                                                    <span className="font-semibold">{item.bebidaprecio.horas != null ? `${item.bebidaprecio.horas} hrs` : "—"}</span>
                                                    <span className="text-gray-400 mx-1">·</span>
                                                    <span>${item.bebidaprecio.precioporpersona != null ? Number(item.bebidaprecio.precioporpersona).toLocaleString("es-MX", { minimumFractionDigits: 2 }) : "0.00"} / persona</span>
                                                  </div>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const nombre = item.descripcion || item.nombre || item.elemento || ""
                                                  setEliminarPendiente({ tipoelemento: item.tipoelemento, id: item.elementoid ?? item.id, nombre })
                                                  setShowConfirmEliminarModal(true)
                                                }}
                                                className="opacity-0 group-hover/con:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded flex-shrink-0"
                                                title="Eliminar"
                                              >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                  <polyline points="3 6 5 6 21 6"/>
                                                  <path d="M19 6l-1 14H6L5 6"/>
                                                  <path d="M10 11v6M14 11v6"/>
                                                  <path d="M9 6V4h6v2"/>
                                                </svg>
                                              </button>
                                            </div>
                                          ))}
                                          <button
                                            type="button"
                                            onClick={() => handleAbrirAgregar("consumo", null, bebId)}
                                            className="mt-1 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                              <line x1="12" y1="5" x2="12" y2="19"/>
                                              <line x1="5" y1="12" x2="19" y2="12"/>
                                            </svg>
                                            Agregar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {/* Agregar otro menú de bebidas */}
                            <button
                              type="button"
                              onClick={() => handleAbrirAgregar("bebidas")}
                              className="flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                              Agregar menú
                            </button>
                          </div>
                        )}
                        {false && tipo === "alimentos" && selectedPaqueteInfo?.tipopaquete !== "Completo" && (
                          <div className="mt-4 ml-11 border-l-2 border-[#1a3d2e]/20 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 flex items-center justify-center text-[#1a3d2e]">
                                {tipoIconMap["platillos"]}
                              </div>
                              <h4 className="text-xs font-bold tracking-widest text-[#1a3d2e] uppercase">Platillos</h4>
                            </div>
                            <div className="space-y-1">
                              {platillosItems.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between gap-2 group">
                                  <button
                                    type="button"
                                    onClick={() => handleVerPDF(Number(item.elementoid ?? item.id), "platillos")}
                                    className={`text-sm text-left underline decoration-dotted cursor-pointer ${item.destacado ? "text-[#b87333] hover:text-[#b87333]/70" : "text-[#1a3d2e] hover:text-[#1a3d2e]/70"}`}
                                    title="Ver documento PDF"
                                  >
                                    {item.descripcion || item.nombre || item.elemento || ""}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nombre = item.descripcion || item.nombre || item.elemento || ""
                                      setEliminarPendiente({ tipoelemento: item.tipoelemento, id: item.elementoid ?? item.id, nombre })
                                      setShowConfirmEliminarModal(true)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded flex-shrink-0"
                                    title="Eliminar elemento"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path d="M19 6l-1 14H6L5 6"/>
                                      <path d="M10 11v6M14 11v6"/>
                                      <path d="M9 6V4h6v2"/>
                                    </svg>
                                  </button>
                                </div>
                              ))}
                              {(() => {
                                const alimentoOk = !!elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
                                return (
                                  <button
                                    type="button"
                                    disabled={!alimentoOk}
                                    onClick={() => handleAbrirAgregar("platillos")}
                                    title={!alimentoOk ? "Primero selecciona un Alimento (menú)" : undefined}
                                    className="mt-2 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#1a3d2e] disabled:hover:border-[#1a3d2e]/30"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                      <line x1="12" y1="5" x2="12" y2="19"/>
                                      <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    Agregar
                                  </button>
                                )
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <div className="grid grid-cols-2 gap-x-12">
                      <div className="space-y-6">
                        {leftGroups.map(([tipo, items], i) => renderGroup(tipo, items, i === leftGroups.length - 1))}
                      </div>
                      <div className="space-y-6">
                        {rightGroups.map(([tipo, items], i) => renderGroup(tipo, items, i === rightGroups.length - 1))}
                      </div>
                    </div>
                  )
                })()}

                {/* Pricing section */}
                {(selectedPaqueteInfo?.precio2025 || selectedPaqueteInfo?.precio2026 || selectedPaqueteInfo?.precio) && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-stretch gap-0">
                      {selectedPaqueteInfo?.precio2025 && (
                        <div className="text-center px-10 border-r border-[#1a3d2e]/40">
                          <p className="text-2xl font-bold text-[#1a3d2e]">2025</p>
                          <div className="h-px w-full bg-[#1a3d2e]/30 my-2" />
                          <p className="text-xl font-semibold text-[#1a3d2e]">${selectedPaqueteInfo?.precio2025}</p>
                        </div>
                      )}
                      {selectedPaqueteInfo?.precio2026 && (
                        <div className="text-center px-10">
                          <p className="text-2xl font-bold text-[#1a3d2e]">2026</p>
                          <div className="h-px w-full bg-[#1a3d2e]/30 my-2" />
                          <p className="text-xl font-semibold text-[#1a3d2e]">${selectedPaqueteInfo?.precio2026}</p>
                        </div>
                      )}
                      {!selectedPaqueteInfo?.precio2025 && !selectedPaqueteInfo?.precio2026 && selectedPaqueteInfo?.precio && (
                        <div className="text-center px-10">
                          <p className="text-2xl font-bold text-[#1a3d2e]">Precio</p>
                          <div className="h-px w-full bg-[#1a3d2e]/30 my-2" />
                          <p className="text-xl font-semibold text-[#1a3d2e]">${selectedPaqueteInfo?.precio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-center text-xs text-gray-500 italic mt-3">Precio regular. Incluye IVA y propina.</p>
            </div>

            {loadingElementos && (
              <p className="text-sm text-gray-500 text-center py-6">Cargando elementos...</p>
            )}

            {/* Separador y Secciones Audiovisual + Complementos */}
            <div className="bg-[#f7f5f0] rounded-xl p-8 mt-8 border-t-2 border-[#1a3d2e]/20">
              <div className="grid grid-cols-2 gap-x-12">
                {/* Audiovisual */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center text-[#1a3d2e]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="17 2 12 7 7 2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold tracking-widest text-[#1a3d2e] uppercase">Audiovisual</h3>
                  </div>
                  <div className="pl-11 space-y-1">
                    {audiovisualItems.length > 0 ? (
                      audiovisualItems.map((item: any, i: number) => {
                        const avNombre = item.audiovisual?.nombre || item.audiovisual?.descripcion || "Elemento"
                        return (
                          <div key={i} className="flex items-center justify-between gap-2 group">
                            <span className={`text-sm font-semibold text-[#1a3d2e] break-words`}>{avNombre}</span>
                            <button type="button" onClick={() => handleEliminarAudiovisual(Number(item.audiovisual?.id || item.elementoid))} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded flex-shrink-0" title="Eliminar">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-gray-400 italic">No hay elementos audiovisuales asignados</p>
                    )}
                    <button type="button" onClick={handleAbrirAudiovisual} className="mt-2 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Agregar
                    </button>
                  </div>
                </div>
                {/* Complementos */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center text-[#1a3d2e]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold tracking-widest text-[#1a3d2e] uppercase">Complementos</h3>
                  </div>
                  <div className="pl-11 space-y-1">
                    {complementoItems.length > 0 ? (
                      complementoItems.map((item: any, i: number) => {
                        const compNombre = item.complemento?.nombre || "Elemento"
                        const compImgUrl = item.complemento?.imgurl
                        return (
                          <div key={i} className="flex items-center justify-between gap-2 group">
                            <span className={`text-sm font-semibold text-[#1a3d2e] break-words`}>{compNombre}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {compImgUrl && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setShowPDFModal(true)
                                    setPdfModalUrl(compImgUrl)
                                    setLoadingPDF(false)
                                  }}
                                  className="text-[10px] text-[#1a3d2e] hover:text-[#1a3d2e]/70 underline decoration-dotted"
                                  title="Ver documento PDF"
                                >
                                  PDF
                                </button>
                              )}
                              <button type="button" onClick={() => handleEliminarComplemento(Number(item.complemento?.id || item.elementoid))} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded" title="Eliminar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-gray-400 italic">No hay complementos asignados</p>
                    )}
                    {(() => {
                      const tieneAlimento = elementosPaquete.some((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
                      return tieneAlimento ? (
                        <button type="button" onClick={handleAbrirComplemento} className="mt-2 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Agregar
                        </button>
                      ) : (
                        <p className="mt-2 text-xs text-gray-400 italic">Seleccione un alimento primero</p>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Agregar Audiovisual */}
      {showAudiovisualModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1a3d2e] to-[#2a5a44] text-white">
              <div>
                <h2 className="text-lg font-bold">Agregar Audiovisual</h2>
                <p className="text-xs text-white/80 mt-0.5">Selecciona uno o varios elementos; pasa el mouse para ver el PDF</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedAudiovisualIds.size > 0 && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {selectedAudiovisualIds.size} seleccionado{selectedAudiovisualIds.size !== 1 ? "s" : ""}
                  </span>
                )}
                <button type="button" onClick={() => { setShowAudiovisualModal(false); setSelectedAudiovisualIds(new Set()); setPreviewAudiovisualId(null); setAvPdfUrl(""); setAudiovisualSearch("") }} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body: split layout */}
            <div className="flex-1 overflow-hidden grid md:grid-cols-[1fr_1.2fr] gap-0 h-[70vh]">
              {/* Izquierda: lista + búsqueda */}
              <div className="flex flex-col border-r border-gray-200 bg-gray-50 min-h-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-white space-y-2">
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      value={audiovisualSearch}
                      onChange={(e) => setAudiovisualSearch(e.target.value)}
                      placeholder="Buscar audiovisual..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d2e]/30 focus:border-[#1a3d2e]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {(() => {
                        const filtrados = audiovisualTabla.filter((el: any) => !audiovisualSearch || el.nombre?.toLowerCase().includes(audiovisualSearch.toLowerCase()))
                        return `${filtrados.length} disponible${filtrados.length !== 1 ? "s" : ""}`
                      })()}
                    </span>
                    {selectedAudiovisualIds.size > 0 && (
                      <button type="button" onClick={() => setSelectedAudiovisualIds(new Set())} className="text-[#1a3d2e] hover:underline">
                        Limpiar selección
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {loadingAudiovisual ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 border-2 border-[#1a3d2e]/30 border-t-[#1a3d2e] rounded-full animate-spin" />
                    </div>
                  ) : (() => {
                    const filtrados = audiovisualTabla.filter((el: any) => !audiovisualSearch || el.nombre?.toLowerCase().includes(audiovisualSearch.toLowerCase()))
                    if (filtrados.length === 0) {
                      return <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
                    }
                    return filtrados.map((el: any) => {
                      const id = Number(el.id)
                      const isSelected = selectedAudiovisualIds.has(id)
                      const isPreviewing = previewAudiovisualId === id
                      return (
                        <div
                          key={id}
                          onClick={() => {
                            setSelectedAudiovisualIds(prev => {
                              const next = new Set(prev)
                              if (next.has(id)) next.delete(id); else next.add(id)
                              return next
                            })
                            loadAudiovisualPreview(id)
                          }}
                          onMouseEnter={() => { if (previewAudiovisualId !== id) loadAudiovisualPreview(id) }}
                          className={`group relative cursor-pointer rounded-lg border-2 px-3 py-2.5 transition-all hover:shadow-md ${
                            isSelected
                              ? "border-[#1a3d2e] bg-emerald-50 shadow-sm"
                              : isPreviewing
                                ? "border-[#1a3d2e]/40 bg-white"
                                : "border-gray-200 bg-white hover:border-[#1a3d2e]/40"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                              isSelected ? "bg-[#1a3d2e] border-[#1a3d2e]" : "border-gray-300 bg-white group-hover:border-[#1a3d2e]/60"
                            }`}>
                              {isSelected && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isSelected ? "text-[#1a3d2e]" : "text-gray-900"} truncate`}>
                                {el.nombre}
                              </p>
                              {el.costo != null && Number(el.costo) > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  ${Number(el.costo).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Derecha: preview del PDF */}
              <div className="bg-gray-100 flex flex-col min-h-0 overflow-hidden">
                {avPdfUrl ? (
                  <iframe src={`${avPdfUrl}#navpanes=0`} className="w-full h-full border-0" title="Vista previa PDF" />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-xs">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">
                        Pasa el mouse sobre un audiovisual para ver su PDF
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-white">
              <div className="text-sm text-gray-600">
                {selectedAudiovisualIds.size > 0 ? (
                  <span>
                    <span className="font-semibold text-[#1a3d2e]">{selectedAudiovisualIds.size}</span> audiovisual{selectedAudiovisualIds.size !== 1 ? "es" : ""} listo{selectedAudiovisualIds.size !== 1 ? "s" : ""} para agregar
                  </span>
                ) : (
                  <span className="text-gray-400">Selecciona al menos un audiovisual</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowAudiovisualModal(false); setSelectedAudiovisualIds(new Set()); setPreviewAudiovisualId(null); setAvPdfUrl(""); setAudiovisualSearch("") }}>
                  Cancelar
                </Button>
                <Button type="button" disabled={selectedAudiovisualIds.size === 0 || savingAudiovisual} onClick={handleAgregarAudiovisual} className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white min-w-[140px]">
                  {savingAudiovisual ? "Agregando..." : `Agregar ${selectedAudiovisualIds.size > 0 ? `(${selectedAudiovisualIds.size})` : ""}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Complemento */}
      {showComplementoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1a3d2e] to-[#2a5a44] text-white">
              <div>
                <h2 className="text-lg font-bold">Agregar Complementos</h2>
                <p className="text-xs text-white/80 mt-0.5">Selecciona uno o varios complementos; pasa el mouse para ver el PDF</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedComplementoIds.size > 0 && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {selectedComplementoIds.size} seleccionado{selectedComplementoIds.size !== 1 ? "s" : ""}
                  </span>
                )}
                <button type="button" onClick={() => { setShowComplementoModal(false); setSelectedComplementoIds(new Set()); setPreviewComplementoId(null); setCompPdfUrl(""); setComplementoSearch("") }} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body: split layout */}
            <div className="flex-1 overflow-hidden grid md:grid-cols-[1fr_1.2fr] gap-0 h-[70vh]">
              {/* Izquierda: lista + búsqueda */}
              <div className="flex flex-col border-r border-gray-200 bg-gray-50 min-h-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-white space-y-2">
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      value={complementoSearch}
                      onChange={(e) => setComplementoSearch(e.target.value)}
                      placeholder="Buscar complemento..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d2e]/30 focus:border-[#1a3d2e]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {(() => {
                        const filtrados = complementoTabla.filter((el: any) => !complementoSearch || el.nombre?.toLowerCase().includes(complementoSearch.toLowerCase()))
                        return `${filtrados.length} disponible${filtrados.length !== 1 ? "s" : ""}`
                      })()}
                    </span>
                    {selectedComplementoIds.size > 0 && (
                      <button type="button" onClick={() => setSelectedComplementoIds(new Set())} className="text-[#1a3d2e] hover:underline">
                        Limpiar selección
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {loadingComplemento ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 border-2 border-[#1a3d2e]/30 border-t-[#1a3d2e] rounded-full animate-spin" />
                    </div>
                  ) : (() => {
                    const filtrados = complementoTabla.filter((el: any) => !complementoSearch || el.nombre?.toLowerCase().includes(complementoSearch.toLowerCase()))
                    if (filtrados.length === 0) {
                      return <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
                    }
                    return filtrados.map((el: any) => {
                      const id = Number(el.id)
                      const isSelected = selectedComplementoIds.has(id)
                      const isPreviewing = previewComplementoId === id
                      return (
                        <div
                          key={id}
                          onClick={() => {
                            setSelectedComplementoIds(prev => {
                              const next = new Set(prev)
                              if (next.has(id)) next.delete(id); else next.add(id)
                              return next
                            })
                            loadComplementoPreview(id)
                          }}
                          onMouseEnter={() => { if (previewComplementoId !== id) loadComplementoPreview(id) }}
                          className={`group relative cursor-pointer rounded-lg border-2 px-3 py-2.5 transition-all hover:shadow-md ${
                            isSelected
                              ? "border-[#1a3d2e] bg-emerald-50 shadow-sm"
                              : isPreviewing
                                ? "border-[#1a3d2e]/40 bg-white"
                                : "border-gray-200 bg-white hover:border-[#1a3d2e]/40"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                              isSelected ? "bg-[#1a3d2e] border-[#1a3d2e]" : "border-gray-300 bg-white group-hover:border-[#1a3d2e]/60"
                            }`}>
                              {isSelected && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isSelected ? "text-[#1a3d2e]" : "text-gray-900"} truncate`}>
                                {el.nombre}
                              </p>
                              {el.costo != null && Number(el.costo) > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  ${Number(el.costo).toLocaleString("es-MX", { minimumFractionDigits: 2 })} / persona
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Derecha: preview del PDF */}
              <div className="bg-gray-100 flex flex-col min-h-0 overflow-hidden">
                {compPdfUrl ? (
                  <iframe src={`${compPdfUrl}#navpanes=0`} className="w-full h-full border-0" title="Vista previa PDF" />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-xs">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">
                        Pasa el mouse sobre un complemento para ver su PDF
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-white">
              <div className="text-sm text-gray-600">
                {selectedComplementoIds.size > 0 ? (
                  <span>
                    <span className="font-semibold text-[#1a3d2e]">{selectedComplementoIds.size}</span> complemento{selectedComplementoIds.size !== 1 ? "s" : ""} listo{selectedComplementoIds.size !== 1 ? "s" : ""} para agregar
                  </span>
                ) : (
                  <span className="text-gray-400">Selecciona al menos un complemento</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowComplementoModal(false); setSelectedComplementoIds(new Set()); setPreviewComplementoId(null); setCompPdfUrl(""); setComplementoSearch("") }}>
                  Cancelar
                </Button>
                <Button type="button" disabled={selectedComplementoIds.size === 0 || savingComplemento} onClick={handleAgregarComplemento} className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white min-w-[140px]">
                  {savingComplemento ? "Agregando..." : `Agregar ${selectedComplementoIds.size > 0 ? `(${selectedComplementoIds.size})` : ""}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sección Presupuesto */}
      {cotizacionId && presupuestoItems.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#1a3d2e]" />
              Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a3d2e] text-white">
                    <th className="text-left px-3 py-3 font-medium w-10">#</th>
                    <th className="text-left px-3 py-3 font-medium">Concepto</th>
                    <th className="text-left px-3 py-3 font-medium w-28">Tipo</th>
                    <th className="text-right px-3 py-3 font-medium w-28">Precio</th>
                    <th className="text-right px-3 py-3 font-medium w-24">IVA</th>
                    <th className="text-right px-3 py-3 font-medium w-28">Servicio (propina)</th>
                    <th className="text-right px-3 py-3 font-medium w-28">Subtotal</th>
                    <th className="text-center px-3 py-3 font-medium w-20">Cantidad</th>
                    <th className="text-center px-3 py-3 font-medium w-16">Días</th>
                    <th className="text-right px-3 py-3 font-medium w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Regla de cortesía: si la suma de los demás conceptos (paquete, complementos, etc.)
                    // es >= total del salón, el salón queda como cortesía y no suma al total.
                    const otrosTotal = presupuestoItems
                      .filter(p => p.tipo !== "Salón")
                      .reduce((s, p) => s + p.total, 0)
                    return presupuestoItems.map((item, index) => {
                      const esCortesiaSalon = item.tipo === "Salón" && item.total > 0 && otrosTotal >= item.total
                      return (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-3 py-3 text-gray-900 font-medium">{item.concepto}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.tipo === "Salón" ? "bg-blue-100 text-blue-700" :
                          item.tipo === "Paquete" ? "bg-orange-100 text-orange-700" :
                          item.tipo === "Audiovisual" ? "bg-purple-100 text-purple-700" :
                          item.tipo === "Complemento" ? "bg-teal-100 text-teal-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-900">
                        {item.precio > 0 ? `$${item.precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "Por definir"}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-500">
                        {item.iva > 0 ? `$${item.iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "-"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.servicio || ""}
                          placeholder="-"
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : 0
                            setPresupuestoItems(prev => prev.map((p, i) => {
                              if (i !== index) return p
                              const cant = p.cantidad || 1
                              const dias = p.dias || 1
                              return { ...p, servicio: val, total: (p.subtotal + val) * cant * dias }
                            }))
                          }}
                          className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a3d2e] focus:border-[#1a3d2e]"
                        />
                      </td>
                      <td className="px-3 py-3 text-right text-gray-900">
                        {(() => {
                          const subTotalConServicio = item.subtotal + (item.servicio || 0)
                          return subTotalConServicio > 0
                            ? `$${subTotalConServicio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                            : "Por definir"
                        })()}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900">{item.cantidad || "-"}</td>
                      <td className="px-3 py-3 text-center text-gray-900">{item.dias}</td>
                      <td className="px-3 py-3 text-right text-gray-900 font-medium">
                        {esCortesiaSalon ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            Cortesía
                          </span>
                        ) : (
                          item.total > 0 ? `$${item.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "Por definir"
                        )}
                      </td>
                    </tr>
                      )
                    })
                  })()}
                </tbody>
                <tfoot>
                  <tr className="bg-[#1a3d2e]/5 border-t-2 border-[#1a3d2e]/20">
                    <td colSpan={9} className="px-3 py-3 text-right font-semibold text-gray-900">Total</td>
                    <td className="px-3 py-3 text-right font-bold text-[#1a3d2e] text-base">
                      {(() => {
                        const otrosTotal = presupuestoItems.filter(p => p.tipo !== "Salón").reduce((s, p) => s + p.total, 0)
                        const total = presupuestoItems.reduce((sum, i) => {
                          const esCortesiaSalon = i.tipo === "Salón" && i.total > 0 && otrosTotal >= i.total
                          return sum + (esCortesiaSalon ? 0 : i.total)
                        }, 0)
                        return total > 0 ? `$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "Por definir"
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de reservaciones (réplica inferior, después de la sección de presupuesto) */}
      {renderReservacionTabs()}

      {/* Botón Agregar Nueva Reservación: solo visible cuando el evento ya existe en DB */}
      {eventoId && !readOnly && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDuplicarReservacionModal(true)}
            className="border-[#1a3d2e] text-[#1a3d2e] hover:bg-[#1a3d2e]/5"
          >
            + Agregar Nueva Reservación
          </Button>
        </div>
      )}

      {/* Modal: ¿Duplicar información de la reservación actual? */}
      {showDuplicarReservacionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#1a3d2e] to-[#2a5a44] px-6 pt-7 pb-7 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </div>
            </div>
            <div className="px-8 pt-6 pb-8 text-center">
              <h3 className="text-lg font-bold text-[#1a3d2e] mb-2">¿Duplicar reservación actual?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Se replicarán todos los datos (paquete, elementos, platillos, etc.) en la nueva reservación, excepto <span className="font-semibold">salón, fecha y horas</span>, que tendrás que elegir nuevamente.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={async () => {
                    setShowDuplicarReservacionModal(false)
                    await handleAgregarReservacion(true)
                  }}
                  className="w-full bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white font-medium"
                >
                  Sí, duplicar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    setShowDuplicarReservacionModal(false)
                    await handleAgregarReservacion(false)
                  }}
                  className="w-full border-[#1a3d2e] text-[#1a3d2e] hover:bg-[#1a3d2e]/5"
                >
                  Crear en blanco
                </Button>
                <button
                  type="button"
                  onClick={() => setShowDuplicarReservacionModal(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: cambios sin guardar antes de generar */}
      {showUnsavedBeforeGenerarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="relative bg-gradient-to-br from-amber-600 to-amber-500 px-6 pt-7 pb-7 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>
            <div className="px-8 pt-6 pb-8 text-center">
              <h3 className="text-lg font-bold text-[#1a3d2e] mb-2">Cambios sin guardar</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tienes modificaciones pendientes en la cotización. ¿Deseas actualizar los cambios antes de generar el documento?
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={generarSavingFromModal}
                  onClick={async () => {
                    setGenerarSavingFromModal(true)
                    const res = await saveCotizacion()
                    setGenerarSavingFromModal(false)
                    if (!res.success) {
                      alert(`Error al actualizar cotización: ${res.error || ""}`)
                      return
                    }
                    setShowUnsavedBeforeGenerarModal(false)
                    setShowConfirmGenerarModal(true)
                  }}
                  className="w-full bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white font-medium"
                >
                  {generarSavingFromModal ? "Guardando..." : "Sí, actualizar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={generarSavingFromModal}
                  onClick={() => {
                    setShowUnsavedBeforeGenerarModal(false)
                    setShowConfirmGenerarModal(true)
                  }}
                  className="w-full border-[#1a3d2e] text-[#1a3d2e] hover:bg-[#1a3d2e]/5"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar generación de cotización */}
      {showConfirmGenerarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#8B0000] to-[#a83232] px-6 pt-7 pb-7 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
            </div>
            <div className="px-8 pt-6 pb-8 text-center">
              <h3 className="text-lg font-bold text-[#1a3d2e] mb-2">Generar cotización</h3>
              <p className="text-sm text-gray-500 mb-6">
                Se generará el documento PDF con la información capturada en esta cotización. ¿Deseas continuar?
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={generatingPDF}
                  onClick={async () => {
                    setShowConfirmGenerarModal(false)
                    await handleGenerarPDF()
                  }}
                  className="w-full bg-[#8B0000] hover:bg-[#8B0000]/90 text-white font-medium"
                >
                  {generatingPDF ? "Generando..." : "Sí, generar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmGenerarModal(false)}
                  className="w-full border-[#1a3d2e] text-[#1a3d2e] hover:bg-[#1a3d2e]/5"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cotizacionId && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                const hayCambios = !readOnly && reservacionTabs.some((_, idx) => isTabDirty(idx))
                if (hayCambios) {
                  setShowUnsavedBeforeGenerarModal(true)
                } else {
                  setShowConfirmGenerarModal(true)
                }
              }}
              disabled={generatingPDF || !formData.salon || !elementosPaquete.some((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos") || platillosItems.length === 0}
              className="min-w-[160px] bg-[#8B0000] hover:bg-[#8B0000]/90 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              {generatingPDF ? "Generando..." : "Generar Cotización"}
            </Button>
          </div>

          {pdfGenerated && (
            <div className="flex justify-end">
              <div className="flex items-center gap-4 border border-gray-200 rounded-lg px-4 py-3 bg-white shadow-sm">
                <span className="text-sm font-medium text-gray-700">Se requiere Autorizacion?</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiereAutorizacion === "si"}
                    onChange={() => setRequiereAutorizacion(requiereAutorizacion === "si" ? null : "si")}
                    className="h-4 w-4 rounded border-gray-300 text-[#1a3d2e] focus:ring-[#1a3d2e] cursor-pointer accent-[#1a3d2e]"
                  />
                  <span className="text-sm text-gray-600">Si</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiereAutorizacion === "no"}
                    onChange={() => setRequiereAutorizacion(requiereAutorizacion === "no" ? null : "no")}
                    className="h-4 w-4 rounded border-gray-300 text-[#1a3d2e] focus:ring-[#1a3d2e] cursor-pointer accent-[#1a3d2e]"
                  />
                  <span className="text-sm text-gray-600">No</span>
                </label>
                {requiereAutorizacion === "si" && (
                  <Button
                    type="button"
                    className="ml-2 bg-amber-600 hover:bg-amber-700 text-white text-sm"
                    onClick={() => alert("Enviar Autorizacion - funcionalidad pendiente")}
                  >
                    Enviar Autorizacion
                  </Button>
                )}
                {requiereAutorizacion === "no" && (
                  <Button
                    type="button"
                    className="ml-2 bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white text-sm"
                    onClick={() => alert("Enviar por correo - funcionalidad pendiente")}
                  >
                    Enviar por correo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Limpiar Paquete */}
      {showLimpiarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Limpiar Paquete</h2>
              <button
                type="button"
                onClick={() => setShowLimpiarModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas eliminar todos los elementos del paquete asignado a esta cotización? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowLimpiarModal(false)} disabled={limpiarLoading}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={limpiarLoading}
                onClick={handleLimpiarPaquete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {limpiarLoading ? "Eliminando..." : "Aceptar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Paquete */}
      {showPaqueteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Seleccionar Paquete</h2>
              <button
                type="button"
                onClick={() => { setShowPaqueteModal(false); setPreviewPaqueteId(""); setPreviewPaqueteInfo(null); setElementosPreviewPaquete([]) }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Paquete</Label>
              {loadingPaquetes ? (
                <p className="text-sm text-gray-500">Cargando paquetes...</p>
              ) : paquetes.length === 0 ? (
                <p className="text-sm text-gray-400">No hay paquetes disponibles para el tipo de evento seleccionado.</p>
              ) : (
                <Select value={previewPaqueteId} onValueChange={handlePaqueteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paquete" />
                  </SelectTrigger>
                  <SelectContent>
                    {paquetes.map((p) => (
                      <SelectItem key={p.paqueteid || p.id} value={(p.paqueteid || p.id)?.toString()}>
                        {p.nombre || p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Preview de elementos del paquete */}
            {previewPaqueteId && (
              <div className="border rounded-lg bg-[#f7f5f0] overflow-hidden">
                {/* Header con nombre y precio */}
                {previewPaqueteInfo && (
                  <div className="px-4 py-3 border-b border-[#1a3d2e]/10 bg-[#1a3d2e]/5">
                    <p className="text-sm font-bold text-[#1a3d2e] uppercase tracking-wide">
                      {previewPaqueteInfo.nombre || previewPaqueteInfo.name}
                    </p>
                    {(previewPaqueteInfo.precio2025 || previewPaqueteInfo.precio2026 || previewPaqueteInfo.precio) && (
                      <p className="text-xs text-[#1a3d2e]/70 mt-0.5">
                        {previewPaqueteInfo.precio2025
                          ? `$${previewPaqueteInfo.precio2025} (2025)`
                          : previewPaqueteInfo.precio2026
                          ? `$${previewPaqueteInfo.precio2026} (2026)`
                          : `$${previewPaqueteInfo.precio}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Elementos agrupados */}
                <div className="p-4 max-h-72 overflow-y-auto">
                  {loadingPreviewPaquete ? (
                    <p className="text-sm text-gray-500 text-center py-4">Cargando elementos...</p>
                  ) : elementosPreviewPaquete.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Este paquete no tiene elementos registrados.</p>
                  ) : (() => {
                    const grouped: Record<string, any[]> = {}
                    for (const el of elementosPreviewPaquete) {
                      const key = normalizarSeccion(el.tipoelemento || el.tipo || "otros")
                      if (key === "lugar") continue
                      if (!grouped[key]) grouped[key] = []
                      grouped[key].push(el)
                    }
                    const ordenPreview = ["alimentos", "platillos", "bebidas", "cortesias", "mobiliario", "beneficios adicionales", "servicio"]
                    const entries = Object.entries(grouped).sort(([a], [b]) => {
                      const ia = ordenPreview.indexOf(a); const ib = ordenPreview.indexOf(b)
                      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
                    })
                    return (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {entries.map(([tipo, items]) => (
                          <div key={tipo}>
                            <p className="text-[10px] font-bold text-[#1a3d2e] uppercase tracking-widest mb-1">{tipo}</p>
                            <ul className="space-y-0.5">
                              {items.map((item, i) => (
                                <li key={i} className={`text-xs ${item.destacado ? "text-[#b87333]" : "text-gray-600"}`}>
                                  • {item.descripcion || item.nombre || item.elemento || ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowPaqueteModal(false); setPreviewPaqueteId(""); setPreviewPaqueteInfo(null); setElementosPreviewPaquete([]) }}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!previewPaqueteId || assigningPaquete || loadingPreviewPaquete}
                onClick={handleConfirmPaquete}
                className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white"
              >
                {assigningPaquete ? "Asignando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: cambios sin guardar al cambiar de pestaña */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-amber-600">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <h2 className="text-lg font-semibold text-gray-900">Cambios sin guardar</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tienes cambios sin guardar en <span className="font-semibold">{reservacionTabs[activeReservacionIdx]?.label || "esta reservación"}</span>.
                    ¿Deseas guardarlos antes de cambiar de pestaña?
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={savingFromModal}
                onClick={handleDiscardAndSwitch}
                title="Cambiar de pestaña descartando los cambios"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={savingFromModal}
                onClick={handleConfirmSaveAndSwitch}
                className="min-w-[180px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white"
              >
                {savingFromModal ? "Guardando..." : "Actualizar Cotización"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación de elemento */}
      {showConfirmEliminarModal && eliminarPendiente && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-600">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Eliminar elemento</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ¿Deseas eliminar <span className="font-medium text-gray-800">"{eliminarPendiente.nombre}"</span> de la cotización?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowConfirmEliminarModal(false); setEliminarPendiente(null) }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  setShowConfirmEliminarModal(false)
                  await handleEliminarElemento(eliminarPendiente.tipoelemento, eliminarPendiente.id)
                  setEliminarPendiente(null)
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar reemplazo de elementos */}
      {showConfirmReemplazarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-600">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">¿Reemplazar elementos actuales?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Esta cotización ya tiene elementos asignados. Si continúas, todos serán eliminados y reemplazados con los del paquete seleccionado.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowConfirmReemplazarModal(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={ejecutarAsignarPaquete}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Sí, reemplazar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Platillos (entradas / plato fuerte / postres) — tabs compartidos, single-select por tipo */}
      {showPlatillosModal && (() => {
        const activos = platillosTabla[platillosActiveTipo] || []
        const filtrados = activos.filter((el: any) => {
          if (!platillosSearch) return true
          return (el.nombre || el.descripcion || "").toLowerCase().includes(platillosSearch.toLowerCase())
        })
        const cerrarPlat = () => {
          setShowPlatillosModal(false)
          setPlatillosSearch("")
          setPlatillosPreviewPdf("")
          setPlatillosPreviewId(null)
        }
        const tipoLabel = (t: PlatilloTipo) => t === "ENTRADAS" ? "Entradas" : t === "PLATO FUERTE" ? "Plato Fuerte" : "Postres"
        const nombreDePlatilloId = (tipo: PlatilloTipo, id: number | null) => {
          if (!id) return null
          const it = (platillosTabla[tipo] || []).find((el: any) => Number(el.id) === id)
          return it?.nombre || it?.descripcion || null
        }
        const totalSel = PLATILLOS_TIPOS.reduce((s, t) => s + (platillosSeleccion[t] ? 1 : 0), 0)
        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1a3d2e] to-[#2a5a44] text-white">
              <div>
                <h2 className="text-lg font-bold">Seleccionar Platillos del Menú</h2>
                <p className="text-xs text-white/80 mt-0.5">Elige una opción por cada sección (entrada, plato fuerte, postre)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {totalSel} / {PLATILLOS_TIPOS.length} seleccionados
                </span>
                <button type="button" onClick={cerrarPlat} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs de tipos */}
            <div className="flex items-center gap-1 border-b border-slate-200 px-4 bg-gray-50">
              {PLATILLOS_TIPOS.map((t) => {
                const hasSel = !!platillosSeleccion[t]
                const isActive = t === platillosActiveTipo
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setPlatillosActiveTipo(t)
                      setPlatillosSearch("")
                      setPlatillosPreviewPdf("")
                      setPlatillosPreviewId(null)
                    }}
                    className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      isActive ? "border-[#1a3d2e] text-[#1a3d2e] bg-white" : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-white"
                    }`}
                  >
                    <span>{tipoLabel(t)}</span>
                    {hasSel && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Seleccionado" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden grid md:grid-cols-[1fr_1.2fr_280px] gap-0 h-[68vh]">
              {/* Lista del tipo activo */}
              <div className="flex flex-col border-r border-gray-200 bg-gray-50 min-h-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      value={platillosSearch}
                      onChange={(e) => setPlatillosSearch(e.target.value)}
                      placeholder={`Buscar ${tipoLabel(platillosActiveTipo).toLowerCase()}...`}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d2e]/30 focus:border-[#1a3d2e]"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {loadingPlatillosModal ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 border-2 border-[#1a3d2e]/30 border-t-[#1a3d2e] rounded-full animate-spin" />
                    </div>
                  ) : filtrados.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
                  ) : (() => {
                    const grupos = new Map<string, any[]>()
                    for (const el of filtrados) {
                      const key = ((el.nombre || "") as string).trim() || "(sin nombre)"
                      if (!grupos.has(key)) grupos.set(key, [])
                      grupos.get(key)!.push(el)
                    }
                    const currentSelId = platillosSeleccion[platillosActiveTipo]
                    const toggleGroup = (nombre: string) => {
                      setExpandedAlimentoGroups(prev => {
                        const next = new Set(prev)
                        if (next.has(nombre)) next.delete(nombre); else next.add(nombre)
                        return next
                      })
                    }
                    const renderOpcion = (el: any, indent: boolean) => {
                      const id = Number(el.id)
                      const horasLabel = el.horas != null ? (typeof el.horas === "number" || /^\d+(\.\d+)?$/.test(String(el.horas)) ? `${el.horas} horas` : String(el.horas)) : null
                      const descripcion = indent ? (horasLabel || el.descripcion || el.nombre || "") : (el.nombre || el.descripcion || "")
                      const costo = el.costo != null ? Number(el.costo) : null
                      const isSelected = currentSelId === id
                      const isPreviewing = platillosPreviewId === id
                      return (
                        <div
                          key={id}
                          onClick={() => {
                            setPlatillosSeleccion(prev => ({ ...prev, [platillosActiveTipo]: isSelected ? null : id }))
                            setPlatillosPreviewId(id)
                            setPlatillosPreviewPdf(el?.documentopdf || "")
                          }}
                          onDoubleClick={async () => {
                            const t = platillosActiveTipo
                            setPlatillosSeleccion(prev => ({ ...prev, [t]: id }))
                            const idx = PLATILLOS_TIPOS.indexOf(t)
                            const isLast = idx === PLATILLOS_TIPOS.length - 1
                            if (isLast) {
                              const override = { ...platillosSeleccion, [t]: id } as Record<PlatilloTipo, number | null>
                              await handleGuardarPlatillos(override)
                            } else {
                              setPlatillosActiveTipo(PLATILLOS_TIPOS[idx + 1])
                              setPlatillosSearch("")
                              setPlatillosPreviewId(null)
                              setPlatillosPreviewPdf("")
                            }
                          }}
                          onMouseEnter={() => {
                            if (platillosPreviewId !== id) {
                              setPlatillosPreviewId(id)
                              setPlatillosPreviewPdf(el?.documentopdf || "")
                            }
                          }}
                          className={`group relative cursor-pointer rounded-lg border-2 px-3 py-2.5 transition-all hover:shadow-md ${indent ? "ml-5" : ""} ${
                            isSelected ? "border-[#1a3d2e] bg-emerald-50 shadow-sm" : isPreviewing ? "border-[#1a3d2e]/40 bg-white" : "border-gray-200 bg-white hover:border-[#1a3d2e]/40"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                              isSelected ? "bg-[#1a3d2e] border-[#1a3d2e]" : "border-gray-300 bg-white group-hover:border-[#1a3d2e]/60"
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isSelected ? "text-[#1a3d2e]" : "text-gray-900"} break-words`}>
                                {descripcion}
                              </p>
                              {costo != null && costo > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">${costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return Array.from(grupos.entries()).map(([nombre, opciones]) => {
                      if (opciones.length === 1) return renderOpcion(opciones[0], false)
                      const isExpanded = expandedAlimentoGroups.has(nombre)
                      const groupHasSelected = opciones.some((op: any) => Number(op.id) === currentSelId)
                      return (
                        <div key={`grp-${nombre}`} className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => toggleGroup(nombre)}
                            className={`w-full flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition-all hover:shadow-md ${
                              groupHasSelected
                                ? "border-[#1a3d2e] bg-emerald-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-[#1a3d2e]/40"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-[#1a3d2e] transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                              <p className={`text-sm font-semibold ${groupHasSelected ? "text-[#1a3d2e]" : "text-gray-900"} break-words`}>
                                {nombre}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {opciones.length} opciones
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="space-y-1.5">
                              {opciones.map((op: any) => renderOpcion(op, true))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Preview PDF */}
              <div className="bg-gray-100 flex flex-col min-h-0 overflow-hidden">
                {platillosPreviewPdf ? (
                  <iframe src={`${platillosPreviewPdf}#navpanes=0`} className="w-full h-full border-0" title="Vista previa PDF" />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-xs">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">Pasa el mouse para ver el PDF</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: resumen de selecciones */}
              <div className="border-l border-gray-200 bg-white flex flex-col min-h-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <p className="text-xs font-bold tracking-widest text-[#1a3d2e] uppercase">Tus selecciones</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                  {PLATILLOS_TIPOS.map((t) => {
                    const selId = platillosSeleccion[t]
                    const nombre = nombreDePlatilloId(t, selId)
                    return (
                      <div key={t} className="rounded-lg border border-gray-200 p-3 bg-gray-50/60">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold tracking-wider text-[#1a3d2e] uppercase">{tipoLabel(t)}</p>
                          {nombre && (
                            <button type="button" onClick={() => setPlatillosSeleccion(prev => ({ ...prev, [t]: null }))} className="text-gray-400 hover:text-red-500" title="Quitar">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {nombre ? (
                          <p className="mt-1.5 text-sm text-gray-900 font-medium break-words">{nombre}</p>
                        ) : (
                          <p className="mt-1.5 text-xs text-gray-400 italic">Sin seleccionar</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-white">
              <div className="text-sm text-gray-600">
                {totalSel === 3 ? (
                  <span className="text-emerald-700 font-medium">✓ Menú completo</span>
                ) : (
                  <span>Faltan {PLATILLOS_TIPOS.length - totalSel} por elegir</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={cerrarPlat}>Cancelar</Button>
                <Button type="button" disabled={savingPlatillos} onClick={() => handleGuardarPlatillos()} className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white min-w-[140px]">
                  {savingPlatillos ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Modal Agregar Elemento */}
      {/* Modal de éxito al guardar/crear cotización */}
      {successModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative bg-gradient-to-br from-[#1a3d2e] to-[#2a5a44] px-6 pt-8 pb-8 text-center">
              <button
                type="button"
                onClick={() => setSuccessModal({ open: false, created: false })}
                className="absolute top-3 right-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mx-auto w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/20">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1a3d2e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="px-8 pt-6 pb-8 text-center">
              <h3 className="text-xl font-bold text-[#1a3d2e] mb-2">
                {successModal.created ? "¡Cotización creada exitosamente!" : "¡Cotización actualizada!"}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {successModal.created
                  ? "Tu cotización se guardó correctamente. Ya puedes continuar agregando elementos al paquete."
                  : "Los cambios se guardaron correctamente."}
              </p>
              <Button
                type="button"
                onClick={() => setSuccessModal({ open: false, created: false })}
                className="w-full bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white font-medium"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAgregarModal && (() => {
        const isLugar = agregarTipo === "lugar"
        const isAlimentosFlow = agregarTipo === "alimentos"
        const isMenuCompleto = (menuTipoActual || "").toLowerCase() === "completo"
        const alimentosTabs: string[] = isAlimentosFlow
          ? (menuTipoActual == null
              ? ["alimento"]
              : isMenuCompleto
                ? ["alimento", "ENTRADAS", "PLATO FUERTE", "POSTRES"]
                : ["alimento", "platillos"])
          : []
        const alimentoYaSeleccionado = !!elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
        // Tab activo dentro del flujo Alimentos (ignorado si no es alimentos)
        const activeTab = isAlimentosFlow ? alimentosTab : null
        const isPlatilloTipoTab = activeTab === "ENTRADAS" || activeTab === "PLATO FUERTE" || activeTab === "POSTRES"
        const isPlatillosMultiTab = activeTab === "platillos"
        const isAlimentoTab = activeTab === "alimento"
        // Modo single/multi según contexto
        const supportsMulti = !isLugar && !isAlimentoTab && !isPlatilloTipoTab
        const supportsPreview = (agregarTipo === "alimentos" || agregarTipo === "bebidas" || agregarTipo === "platillos" || agregarTipo === "consumo")
        // Lista fuente según la pestaña
        const currentList: any[] = isPlatilloTipoTab ? (platillosTabla[activeTab as PlatilloTipo] || []) : elementosTabla
        const filtrados = currentList.filter((el: any) => {
          if (!elementoSearch) return true
          const nombre = (el.nombre || el.descripcion || el.name || "").toLowerCase()
          return nombre.includes(elementoSearch.toLowerCase())
        })
        const selCount = isPlatilloTipoTab
          ? (platillosSeleccion[activeTab as PlatilloTipo] ? 1 : 0)
          : supportsMulti
            ? selectedElementoIds.size
            : (selectedElementoId ? 1 : 0)
        const tituloTipo = agregarTipo.charAt(0).toUpperCase() + agregarTipo.slice(1)
        const tabLabel = (t: string) => t === "alimento" ? "Alimento" : t === "platillos" ? "Platillo" : t === "ENTRADAS" ? "Entradas" : t === "PLATO FUERTE" ? "Plato Fuerte" : "Postres"
        const cerrar = () => {
          setShowAgregarModal(false)
          setSelectedElementoIds(new Set())
          setSelectedElementoId("")
          setPreviewElementoId(null)
          setPreviewElementoPdf("")
          setElementoSearch("")
        }
        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full ${isAlimentosFlow ? "max-w-[96rem]" : "max-w-6xl"} overflow-hidden h-[92vh] flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1a3d2e] to-[#2a5a44] text-white">
              <div>
                <h2 className="text-lg font-bold">{isLugar ? "Modificar Lugar" : `Agregar ${tituloTipo}`}</h2>
                <p className="text-xs text-white/80 mt-0.5">
                  {isLugar
                    ? "Selecciona el lugar para esta reservación"
                    : supportsPreview
                      ? "Selecciona uno o varios elementos; pasa el mouse para ver el PDF"
                      : "Selecciona uno o varios elementos"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selCount > 0 && supportsMulti && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {selCount} seleccionado{selCount !== 1 ? "s" : ""}
                  </span>
                )}
                <button type="button" onClick={cerrar} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pestañas (solo flujo Alimentos) */}
            {isAlimentosFlow && (
              <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
                {alimentosTabs.map((t) => {
                  const isActive = alimentosTab === t
                  const isAlim = t === "alimento"
                  const disabled = !isAlim && !alimentoYaSeleccionado
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && cambiarAlimentosTab(t)}
                      title={disabled ? "Primero selecciona un Alimento (menú)" : undefined}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${
                        isActive
                          ? "border-[#1a3d2e] text-[#1a3d2e] bg-white"
                          : disabled
                            ? "border-transparent text-gray-300 cursor-not-allowed"
                            : "border-transparent text-gray-500 hover:text-[#1a3d2e] hover:bg-white"
                      }`}
                    >
                      {tabLabel(t)}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Body */}
            <div className={`flex-1 min-h-0 overflow-hidden grid ${isAlimentosFlow ? "md:grid-cols-[1fr_1.2fr_220px]" : supportsPreview ? "md:grid-cols-[1fr_1.2fr]" : "grid-cols-1"} gap-0`}>
              {/* Lista + búsqueda */}
              <div className="flex flex-col border-r border-gray-200 bg-gray-50 min-h-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-white space-y-2">
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      value={elementoSearch}
                      onChange={(e) => setElementoSearch(e.target.value)}
                      placeholder={`Buscar ${agregarTipo}...`}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d2e]/30 focus:border-[#1a3d2e]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {filtrados.length} disponible{filtrados.length !== 1 ? "s" : ""}
                    </span>
                    {supportsMulti && selectedElementoIds.size > 0 && (
                      <button type="button" onClick={() => setSelectedElementoIds(new Set())} className="text-[#1a3d2e] hover:underline">
                        Limpiar selección
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {loadingTabla ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 border-2 border-[#1a3d2e]/30 border-t-[#1a3d2e] rounded-full animate-spin" />
                    </div>
                  ) : filtrados.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      {currentList.length === 0 ? "Todos ya están agregados" : "Sin resultados"}
                    </p>
                  ) : (isAlimentoTab || isPlatilloTipoTab || isPlatillosMultiTab || (!isAlimentosFlow && agregarTipo === "platillos") || agregarTipo === "consumo") ? (() => {
                    const isPlatilloStandalone = !isAlimentosFlow && agregarTipo === "platillos"
                    const isConsumoTab = agregarTipo === "consumo"
                    const grupos = new Map<string, any[]>()
                    for (const el of filtrados) {
                      const key = ((el.nombre || "") as string).trim() || "(sin nombre)"
                      if (!grupos.has(key)) grupos.set(key, [])
                      grupos.get(key)!.push(el)
                    }
                    const currentSelId = isAlimentoTab
                      ? (selectedElementoId ? Number(selectedElementoId) : null)
                      : isPlatilloTipoTab
                        ? platillosSeleccion[activeTab as PlatilloTipo]
                        : null
                    const multiSelIds = (isPlatillosMultiTab || isPlatilloStandalone || isConsumoTab) ? selectedElementoIds : null
                    const toggleGroup = (nombre: string) => {
                      setExpandedAlimentoGroups(prev => {
                        const next = new Set(prev)
                        if (next.has(nombre)) next.delete(nombre); else next.add(nombre)
                        return next
                      })
                    }
                    const renderOpcion = (el: any, indent: boolean) => {
                      const id = Number(el.id)
                      // En pestañas de platillos el indent representa una opción dentro de un grupo de mismo nombre;
                      // ahí mostramos la columna "horas" como etiqueta (cada variante es por horas).
                      const isPlatilloContext = isPlatilloTipoTab || isPlatillosMultiTab || isPlatilloStandalone
                      const horasLabel = el.horas != null ? (typeof el.horas === "number" || /^\d+(\.\d+)?$/.test(String(el.horas)) ? `${el.horas} horas` : String(el.horas)) : null
                      const descripcion = isConsumoTab
                        ? (indent ? (el.descripcion || el.nombre || "") : (el.nombre || el.descripcion || ""))
                        : isPlatilloContext
                          ? (indent ? (horasLabel || el.descripcion || el.nombre || "") : (el.nombre || el.descripcion || ""))
                          : (el.descripcion || el.nombre || el.name || "")
                      const costo = el.costo != null ? Number(el.costo) : null
                      const preciosList: any[] = isConsumoTab && Array.isArray(el.precios) ? el.precios : []
                      const isSelected = isAlimentoTab
                        ? currentSelId === id
                        : isPlatilloTipoTab
                          ? currentSelId === id
                          : multiSelIds?.has(id) || false
                      const isPreviewing = previewElementoId === id
                      // Marca como ya agregado si este platillo ya vive en platillosItems bajo el alimento activo
                      const yaAgregado = isPlatilloContext && platillosItems.some((p: any) =>
                        Number(p.elementoid) === id &&
                        (selectedAlimentoParentId == null || Number(p.platilloid) === selectedAlimentoParentId)
                      )
                      const handleClick = () => {
                        // Consumo con precios: clic en el card expande/colapsa en lugar de seleccionar.
                        // La selección viene al elegir un precio específico en la lista expandida.
                        if (isConsumoTab && preciosList.length > 0) {
                          setExpandedConsumoBebidas(prev => {
                            const next = new Set(prev)
                            if (next.has(id)) next.delete(id); else next.add(id)
                            return next
                          })
                          return
                        }
                        if (isAlimentoTab) {
                          setSelectedElementoId(String(id))
                          setMenuTipoActual(el.tipomenu ? String(el.tipomenu) : null)
                          if (supportsPreview) loadElementoPreview(el)
                        } else if (isPlatilloTipoTab) {
                          setPlatillosSeleccion(prev => ({ ...prev, [activeTab as PlatilloTipo]: id }))
                          if (supportsPreview) loadElementoPreview(el)
                        } else {
                          // multi (platillo Individual / standalone): una variante por grupo
                          const nombreGrupo = ((el.nombre || "") as string).trim()
                          setSelectedElementoIds(prev => {
                            const next = new Set(prev)
                            // Quitar otras variantes del mismo grupo
                            for (const otherId of Array.from(next)) {
                              if (otherId === id) continue
                              const other = (elementosTabla as any[]).find(e => Number(e.id) === otherId)
                              const otherName = ((other?.nombre || "") as string).trim()
                              if (otherName === nombreGrupo) next.delete(otherId)
                            }
                            if (next.has(id)) next.delete(id); else next.add(id)
                            return next
                          })
                          if (supportsPreview) loadElementoPreview(el)
                        }
                      }
                      const handleDoubleClick = async () => {
                        if (isAlimentoTab) {
                          setSelectedElementoId(String(id))
                          if (supportsPreview) loadElementoPreview(el)
                          await handleAlimentoSeleccionado(id, el)
                          return
                        }
                        if (isPlatilloTipoTab) {
                          const t = activeTab as PlatilloTipo
                          setPlatillosSeleccion(prev => ({ ...prev, [t]: id }))
                          const idx = alimentosTabs.indexOf(activeTab as string)
                          const isLast = idx === alimentosTabs.length - 1
                          if (isLast) {
                            const override = { ...platillosSeleccion, [t]: id } as Record<PlatilloTipo, number | null>
                            await handleGuardarPlatillos(override)
                            cerrar()
                          } else {
                            setAlimentosTab(alimentosTabs[idx + 1])
                          }
                          return
                        }
                        if (isPlatillosMultiTab || isPlatilloStandalone) {
                          // Aplicar regla "una por grupo" y sincronizar (agregar nuevo + eliminar variante anterior del mismo grupo)
                          const nombreGrupo = ((el.nombre || "") as string).trim()
                          const newIds = new Set(selectedElementoIds)
                          for (const otherId of Array.from(newIds)) {
                            if (otherId === id) continue
                            const other = (elementosTabla as any[]).find(e => Number(e.id) === otherId)
                            const otherName = ((other?.nombre || "") as string).trim()
                            if (otherName === nombreGrupo) newIds.delete(otherId)
                          }
                          newIds.add(id)
                          setSelectedElementoIds(newIds)
                          setSavingElemento(true)
                          const r = await handleSyncPlatillosIndividual(selectedAlimentoParentId, Array.from(newIds))
                          setSavingElemento(false)
                          if (r.success) cerrar()
                          else alert(`Error al guardar platillos: ${r.error || ""}`)
                        }
                      }
                      const isConsumoExpandable = isConsumoTab && preciosList.length > 0
                      const isConsumoExpanded = isConsumoExpandable && expandedConsumoBebidas.has(id)
                      const toggleConsumoExpand = (e: React.MouseEvent) => {
                        e.stopPropagation()
                        setExpandedConsumoBebidas(prev => {
                          const next = new Set(prev)
                          if (next.has(id)) next.delete(id); else next.add(id)
                          return next
                        })
                      }
                      return (
                        <div
                          key={id}
                          className={`group relative rounded-lg border-2 transition-all hover:shadow-md ${indent ? "ml-5" : ""} ${
                            isSelected
                              ? "border-[#1a3d2e] bg-emerald-50 shadow-sm"
                              : isPreviewing
                                ? "border-[#1a3d2e]/40 bg-white"
                                : "border-gray-200 bg-white hover:border-[#1a3d2e]/40"
                          }`}
                        >
                          <div
                            onClick={handleClick}
                            onDoubleClick={handleDoubleClick}
                            onMouseEnter={() => { if (supportsPreview && previewElementoId !== id) loadElementoPreview(el) }}
                            className="cursor-pointer px-3 py-2.5"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`flex-shrink-0 w-5 h-5 ${(isPlatillosMultiTab || isPlatilloStandalone) ? "rounded" : "rounded-full"} border-2 flex items-center justify-center mt-0.5 transition-colors ${
                                isSelected ? "bg-[#1a3d2e] border-[#1a3d2e]" : "border-gray-300 bg-white group-hover:border-[#1a3d2e]/60"
                              }`}>
                                {isSelected && (
                                  (isPlatillosMultiTab || isPlatilloStandalone) ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  ) : (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  )
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isSelected ? "text-[#1a3d2e]" : "text-gray-900"} break-words`}>
                                  {descripcion}
                                  {yaAgregado && <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-600 font-semibold">Ya agregado</span>}
                                </p>
                                {!isConsumoTab && costo != null && costo > 0 && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    ${costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                                {isConsumoTab && !isConsumoExpandable && costo != null && costo > 0 && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    ${costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                              </div>
                              {isConsumoExpandable && (
                                <button
                                  type="button"
                                  onClick={toggleConsumoExpand}
                                  className="flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-[#1a3d2e] transition-colors"
                                  title={isConsumoExpanded ? "Ocultar opciones" : "Ver opciones de horas"}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${isConsumoExpanded ? "rotate-90" : ""}`}>
                                    <polyline points="9 18 15 12 9 6"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          {isConsumoExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50/50 px-3 py-2">
                              <ul className="space-y-1">
                                {preciosList.map((p: any, idx: number) => {
                                  const precioId = Number(p.id)
                                  const isPrecioSelected = selectedBebidaPrecios[id] === precioId
                                  return (
                                    <li
                                      key={`${id}-p-${p.id ?? idx}`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Seleccionar la bebida padre + este precio
                                        setSelectedElementoIds(prev => {
                                          const next = new Set(prev)
                                          next.add(id)
                                          return next
                                        })
                                        setSelectedBebidaPrecios(prev => ({ ...prev, [id]: precioId }))
                                      }}
                                      className={`text-xs flex items-center gap-2 pl-7 py-1 rounded cursor-pointer transition-colors ${
                                        isPrecioSelected
                                          ? "bg-emerald-100 text-[#1a3d2e] font-semibold"
                                          : "text-gray-700 hover:bg-gray-100"
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                        isPrecioSelected ? "border-[#1a3d2e] bg-[#1a3d2e]" : "border-gray-300 bg-white"
                                      }`}>
                                        {isPrecioSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                      </span>
                                      <span className="font-semibold">
                                        {p.horas != null ? `${p.horas} hrs` : "—"}
                                      </span>
                                      <span className="text-gray-400">·</span>
                                      <span>
                                        ${p.precioporpersona != null ? Number(p.precioporpersona).toLocaleString("es-MX", { minimumFractionDigits: 2 }) : "0.00"} / persona
                                      </span>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    }
                    return Array.from(grupos.entries()).map(([nombre, opciones]) => {
                      if (opciones.length === 1) return renderOpcion(opciones[0], false)
                      const isExpanded = expandedAlimentoGroups.has(nombre)
                      const groupHasSelected = opciones.some((op: any) => {
                        const oid = Number(op.id)
                        if (isAlimentoTab || isPlatilloTipoTab) return currentSelId === oid
                        return multiSelIds?.has(oid) || false
                      })
                      return (
                        <div key={`grp-${nombre}`} className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => toggleGroup(nombre)}
                            className={`w-full flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition-all hover:shadow-md ${
                              groupHasSelected
                                ? "border-[#1a3d2e] bg-emerald-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-[#1a3d2e]/40"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-[#1a3d2e] transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                              <p className={`text-sm font-semibold ${groupHasSelected ? "text-[#1a3d2e]" : "text-gray-900"} break-words`}>
                                {nombre}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {opciones.length} opciones
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="space-y-1.5">
                              {opciones.map((op: any) => renderOpcion(op, true))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })() : filtrados.map((el: any) => {
                    const id = Number(el.id)
                    const nombre = el.nombre || el.descripcion || el.name || ""
                    const costo = el.costo != null ? Number(el.costo) : null
                    const isSelected = isPlatilloTipoTab
                      ? platillosSeleccion[activeTab as PlatilloTipo] === id
                      : supportsMulti
                        ? selectedElementoIds.has(id)
                        : selectedElementoId === String(id)
                    const isPreviewing = previewElementoId === id
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          if (isPlatilloTipoTab) {
                            setPlatillosSeleccion(prev => ({ ...prev, [activeTab as PlatilloTipo]: id }))
                            if (supportsPreview) loadElementoPreview(el)
                            return
                          }
                          if (supportsMulti) {
                            setSelectedElementoIds(prev => {
                              const next = new Set(prev)
                              if (next.has(id)) next.delete(id); else next.add(id)
                              return next
                            })
                          } else {
                            setSelectedElementoId(String(id))
                          }
                          if (supportsPreview) loadElementoPreview(el)
                        }}
                        onDoubleClick={async () => {
                          if (isPlatilloTipoTab) {
                            const t = activeTab as PlatilloTipo
                            setPlatillosSeleccion(prev => ({ ...prev, [t]: id }))
                            const idx = alimentosTabs.indexOf(activeTab as string)
                            const isLast = idx === alimentosTabs.length - 1
                            if (isLast) {
                              const override = { ...platillosSeleccion, [t]: id } as Record<PlatilloTipo, number | null>
                              await handleGuardarPlatillos(override)
                              cerrar()
                            } else {
                              setAlimentosTab(alimentosTabs[idx + 1])
                            }
                            return
                          }
                          if (isPlatillosMultiTab) {
                            // Pestaña "Platillos" (paquete Individual) multi-select en última tab
                            const newIds = new Set(selectedElementoIds)
                            newIds.add(id)
                            setSelectedElementoIds(newIds)
                            await handleAgregarElemento("platillos", Array.from(newIds))
                          }
                        }}
                        onMouseEnter={() => { if (supportsPreview && previewElementoId !== id) loadElementoPreview(el) }}
                        className={`group relative cursor-pointer rounded-lg border-2 px-3 py-2.5 transition-all hover:shadow-md ${
                          isSelected
                            ? "border-[#1a3d2e] bg-emerald-50 shadow-sm"
                            : isPreviewing
                              ? "border-[#1a3d2e]/40 bg-white"
                              : "border-gray-200 bg-white hover:border-[#1a3d2e]/40"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`flex-shrink-0 w-5 h-5 ${supportsMulti ? "rounded" : "rounded-full"} border-2 flex items-center justify-center mt-0.5 transition-colors ${
                            isSelected ? "bg-[#1a3d2e] border-[#1a3d2e]" : "border-gray-300 bg-white group-hover:border-[#1a3d2e]/60"
                          }`}>
                            {isSelected && (
                              supportsMulti ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              ) : (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${isSelected ? "text-[#1a3d2e]" : "text-gray-900"} break-words`}>
                              {nombre}
                            </p>
                            {costo != null && costo > 0 && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                ${costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Preview PDF (solo para tipos con PDF) */}
              {supportsPreview && (
                <div className="bg-gray-100 flex flex-col min-h-0 overflow-hidden relative">
                  {previewElementoPdf ? (
                    <>
                      <iframe src={`${previewElementoPdf}#navpanes=0`} className="w-full h-full border-0" title="Vista previa PDF" />
                      <button
                        type="button"
                        onClick={() => { setPdfModalUrl(previewElementoPdf); setShowPDFModal(true) }}
                        className="absolute bottom-3 right-3 z-10 bg-white/95 hover:bg-white text-[#1a3d2e] text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-colors cursor-zoom-in"
                        title="Ampliar PDF"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <polyline points="15 3 21 3 21 9"/>
                          <polyline points="9 21 3 21 3 15"/>
                          <line x1="21" y1="3" x2="14" y2="10"/>
                          <line x1="3" y1="21" x2="10" y2="14"/>
                        </svg>
                        Ampliar
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center max-w-xs">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-300">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">
                          {previewElementoId ? "Este elemento no tiene PDF asociado" : "Pasa el mouse sobre un elemento para ver su PDF"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resumen lateral (flujo Alimentos) */}
              {isAlimentosFlow && (() => {
                const alimentoEl = elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
                const pendingAlimentoId = selectedElementoId ? Number(selectedElementoId) : null
                const pendingAlimento = pendingAlimentoId
                  ? (elementosTabla as any[]).find(e => Number(e.id) === pendingAlimentoId)
                  : null
                const alimentoLabel = isAlimentoTab && pendingAlimento
                  ? (pendingAlimento.descripcion || pendingAlimento.nombre)
                  : alimentoEl?.descripcion || alimentoEl?.nombre || alimentoEl?.elemento
                const getPlatilloNombre = (tipo: PlatilloTipo, selId: number | null) => {
                  if (!selId) return null
                  const it = (platillosTabla[tipo] || []).find((el: any) => Number(el.id) === selId)
                  return it?.descripcion || it?.nombre || null
                }
                return (
                  <aside className="bg-gradient-to-b from-[#1a3d2e]/5 to-white border-l border-gray-200 flex flex-col min-h-0 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-white">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-[#1a3d2e]">Tu selección</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                      <div>
                        <p className="uppercase tracking-wider text-[10px] font-semibold text-gray-500 mb-1">Alimento</p>
                        {alimentoLabel ? (
                          <p className="text-[#1a3d2e] font-medium leading-snug">{alimentoLabel}</p>
                        ) : (
                          <p className="text-gray-400 italic">Sin seleccionar</p>
                        )}
                      </div>

                      {(menuTipoActual || "").toLowerCase() === "completo" ? (
                        <>
                          {(PLATILLOS_TIPOS as readonly PlatilloTipo[]).map((t) => {
                            const saved = platillosItems.find((p: any) => (p.tipo || "").toUpperCase() === t)
                            const pendingId = platillosSeleccion[t]
                            const pendingName = getPlatilloNombre(t, pendingId)
                            const savedName = saved?.descripcion || saved?.nombre
                            const name = pendingName || savedName
                            const changed = pendingId && saved && Number(saved.elementoid ?? saved.id) !== pendingId
                            const label = t === "ENTRADAS" ? "Entradas" : t === "PLATO FUERTE" ? "Plato Fuerte" : "Postres"
                            return (
                              <div key={t}>
                                <p className="uppercase tracking-wider text-[10px] font-semibold text-gray-500 mb-1">{label}</p>
                                {name ? (
                                  <p className={`leading-snug font-medium ${changed ? "text-amber-700" : "text-[#1a3d2e]"}`}>
                                    {name}
                                    {changed && <span className="block text-[10px] font-normal text-amber-600">(sin guardar)</span>}
                                  </p>
                                ) : (
                                  <p className="text-gray-400 italic">Sin seleccionar</p>
                                )}
                              </div>
                            )
                          })}
                        </>
                      ) : menuTipoActual ? (
                        <div>
                          <p className="uppercase tracking-wider text-[10px] font-semibold text-gray-500 mb-1">Platillos</p>
                          {platillosItems.length === 0 && selectedElementoIds.size === 0 ? (
                            <p className="text-gray-400 italic">Sin seleccionar</p>
                          ) : (
                            <ul className="space-y-1">
                              {platillosItems.map((p: any, i: number) => (
                                <li key={`saved-${i}`} className="text-[#1a3d2e] leading-snug font-medium">
                                  • {p.descripcion || p.nombre}
                                </li>
                              ))}
                              {isPlatillosMultiTab && Array.from(selectedElementoIds).filter(id => !platillosItems.some((p: any) => Number(p.elementoid ?? p.id) === id)).map((id) => {
                                const it = (elementosTabla as any[]).find(e => Number(e.id) === id)
                                const n = it?.descripcion || it?.nombre
                                return n ? (
                                  <li key={`pend-${id}`} className="text-amber-700 leading-snug font-medium">
                                    • {n}
                                    <span className="block text-[10px] font-normal text-amber-600">(sin guardar)</span>
                                  </li>
                                ) : null
                              })}
                            </ul>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </aside>
                )
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-white">
              <div className="text-sm text-gray-600">
                {isAlimentoTab ? (
                  savingElemento ? (
                    <span className="text-[#1a3d2e]">Guardando menú…</span>
                  ) : selectedElementoId ? (
                    <span className="text-[#1a3d2e]">Menú seleccionado · doble clic o Siguiente para continuar</span>
                  ) : (
                    <span className="text-gray-400">Elige un menú (doble clic o Siguiente para avanzar)</span>
                  )
                ) : selCount > 0 ? (
                  <span>
                    <span className="font-semibold text-[#1a3d2e]">{selCount}</span> {isLugar ? "lugar" : `elemento${selCount !== 1 ? "s" : ""}`} listo{selCount !== 1 ? "s" : ""} para {isLugar ? "aplicar" : "agregar"}
                  </span>
                ) : (
                  <span className="text-gray-400">Selecciona al menos un{isLugar ? "" : " elemento"}</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={cerrar}>
                  {isAlimentoTab ? "Cerrar" : "Cancelar"}
                </Button>
                {isAlimentosFlow && (() => {
                  const idx = alimentosTabs.indexOf(alimentosTab)
                  const nextTab = alimentosTabs[idx + 1]
                  if (!nextTab) return null
                  let disabled = false
                  let onNext: () => void | Promise<void>
                  if (isAlimentoTab) {
                    const selId = selectedElementoId ? Number(selectedElementoId) : null
                    disabled = !selId || savingElemento
                    onNext = async () => {
                      if (!selId) return
                      const el = (elementosTabla as any[]).find(e => Number(e.id) === selId)
                      await handleAlimentoSeleccionado(selId, el)
                    }
                  } else if (isPlatilloTipoTab) {
                    disabled = !platillosSeleccion[alimentosTab as PlatilloTipo]
                    onNext = () => setAlimentosTab(nextTab)
                  } else {
                    onNext = () => setAlimentosTab(nextTab)
                  }
                  return (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      onClick={onNext}
                      className="border-[#1a3d2e] text-[#1a3d2e] hover:bg-[#1a3d2e]/5 min-w-[110px]"
                    >
                      Siguiente
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 ml-1">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Button>
                  )
                })()}
                {isPlatilloTipoTab ? (
                  <Button
                    type="button"
                    disabled={savingPlatillos}
                    onClick={async () => { await handleGuardarPlatillos(); cerrar() }}
                    className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white min-w-[140px]"
                  >
                    {savingPlatillos ? "Guardando..." : "Guardar platillos"}
                  </Button>
                ) : (isPlatillosMultiTab || (!isAlimentosFlow && agregarTipo === "platillos")) ? (
                  <Button
                    type="button"
                    disabled={savingElemento}
                    onClick={async () => {
                      setSavingElemento(true)
                      const ids = Array.from(selectedElementoIds)
                      const r = await handleSyncPlatillosIndividual(selectedAlimentoParentId, ids)
                      setSavingElemento(false)
                      if (r.success) { cerrar() } else { alert(`Error al guardar platillos: ${r.error || ""}`) }
                    }}
                    className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white min-w-[140px]"
                  >
                    {savingElemento ? "Guardando..." : "Guardar platillos"}
                  </Button>
                ) : !isAlimentoTab ? (
                  <Button type="button" disabled={selCount === 0 || savingElemento} onClick={() => handleAgregarElemento()} className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white min-w-[140px]">
                    {savingElemento ? "Guardando..." : isLugar ? "Modificar" : `Agregar ${selCount > 0 ? `(${selCount})` : ""}`}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Modal visor PDF */}
      {showPDFModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-2">
          <div className="relative w-full h-full max-w-6xl" style={{ height: "96vh" }}>
            {/* Controles flotantes */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              {pdfModalUrl && (
                <a
                  href={pdfModalUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 text-sm font-medium rounded-lg shadow transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar PDF
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowPDFModal(false)}
                className="flex items-center justify-center w-8 h-8 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido PDF */}
            {loadingPDF ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white text-sm">Cargando documento...</p>
              </div>
            ) : pdfModalUrl ? (
              <iframe src={pdfModalUrl} className="w-full h-full rounded-lg" title="Documento PDF" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white/70 text-sm">Este elemento no tiene documento PDF asociado.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de foto expandida */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          onClick={() => setShowPhotoModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

          {/* Imagen */}
          <div
            className="relative z-10 max-w-5xl w-full max-h-[90vh]"
            style={{ animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={salonFotos[currentPhotoIndex]}
              alt={`Foto ${currentPhotoIndex + 1} del salón`}
              className="w-full h-full object-contain rounded-xl shadow-2xl max-h-[85vh]"
            />

            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => setShowPhotoModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-gray-700">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Prev/Next en modal */}
            {salonFotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentPhotoIndex((p) => (p === 0 ? salonFotos.length - 1 : p - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPhotoIndex((p) => (p === salonFotos.length - 1 ? 0 : p + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </>
            )}

            {/* Contador */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
              {currentPhotoIndex + 1} / {salonFotos.length}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.88) } to { opacity: 1; transform: scale(1) } }
        @keyframes loading-bar { 0% { width: 0% } 50% { width: 70% } 100% { width: 100% } }
      `}</style>
      </fieldset>
    </form>

    {/* Modal Nuevo Cliente */}
    <Dialog open={showNuevoClienteModal} onOpenChange={(open) => {
      setShowNuevoClienteModal(open)
      if (!open) {
        setNuevoClienteForm({ tipo: "", nombre: "", apellidopaterno: "", apellidomaterno: "", email: "", telefono: "", celular: "", direccion: "", empresa: "" })
        setNuevoClienteError("")
      }
    }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <UserPlus className="h-5 w-5" />
            Registrar Nuevo Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {nuevoClienteError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {nuevoClienteError}
            </div>
          )}

          {/* Tipo de Cliente */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tipo de Cliente <span className="text-red-500">*</span></Label>
            <Select value={nuevoClienteForm.tipo} onValueChange={(v) => setNuevoClienteForm(prev => ({ ...prev, tipo: v, empresa: "" }))}>
              <SelectTrigger className="border-blue-200">
                <SelectValue placeholder="Selecciona tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Empresarial">Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Empresa - solo si es Empresarial */}
          {nuevoClienteForm.tipo === "Empresarial" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Nombre Empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nuevoClienteForm.empresa}
                onChange={(e) => setNuevoClienteForm(prev => ({ ...prev, empresa: e.target.value }))}
                placeholder="Nombre de la empresa"
                className="border-blue-200"
              />
            </div>
          )}

          {/* Nombre y Apellidos */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nombre <span className="text-red-500">*</span></Label>
              <Input
                value={nuevoClienteForm.nombre}
                onChange={(e) => setNuevoClienteForm(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre"
                className="border-blue-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Apellido Paterno <span className="text-red-500">*</span></Label>
              <Input
                value={nuevoClienteForm.apellidopaterno}
                onChange={(e) => setNuevoClienteForm(prev => ({ ...prev, apellidopaterno: e.target.value }))}
                placeholder="Apellido paterno"
                className="border-blue-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Apellido Materno</Label>
              <Input
                value={nuevoClienteForm.apellidomaterno}
                onChange={(e) => setNuevoClienteForm(prev => ({ ...prev, apellidomaterno: e.target.value }))}
                placeholder="Opcional"
                className="border-blue-200"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={nuevoClienteForm.email}
              onChange={(e) => setNuevoClienteForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              className="border-blue-200"
            />
          </div>

          {/* Teléfono y Celular */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                value={nuevoClienteForm.telefono}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "")
                  setNuevoClienteForm(prev => ({ ...prev, telefono: val }))
                }}
                placeholder="Solo números"
                className="border-blue-200"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                Celular
              </Label>
              <Input
                type="tel"
                value={nuevoClienteForm.celular}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "")
                  setNuevoClienteForm(prev => ({ ...prev, celular: val }))
                }}
                placeholder="Solo números"
                className="border-blue-200"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Dirección
            </Label>
            <Input
              value={nuevoClienteForm.direccion}
              onChange={(e) => setNuevoClienteForm(prev => ({ ...prev, direccion: e.target.value }))}
              placeholder="Dirección del cliente"
              className="border-blue-200"
            />
          </div>

          {/* Botón Registrar */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleRegistrarCliente}
              disabled={nuevoClienteLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {nuevoClienteLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Registrar Cliente
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
