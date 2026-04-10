"use client"

import { CardDescription } from "@/components/ui/card"
import { listaDesplegableClientes, objetoCliente, crearCliente } from "@/app/actions/clientes"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones, objetoSalon, objetoSalones } from "@/app/actions/salones"
import { crearCotizacion, actualizarCotizacion, objetoCotizacion } from "@/app/actions/cotizaciones"
import { obtenerDisponibilidadSalon, obtenerReservacionesPorDia } from "@/app/actions/reservaciones"
import { AvailabilityCalendar } from "./availability-calendar"
import { listaDesplegableTipoEvento, listaDesplegablePaquetes, obtenerElementosPaquete, obtenerElementosCotizacion, asignarPaqueteACotizacion, eliminarElementoCotizacion, limpiarElementosCotizacion, buscarElementosPorTabla, agregarElementoACotizacion, buscarLugaresPorHotel, modificarLugarCotizacion, listaEstatusCotizacion, obtenerDocumentoPDF, obtenerPlatillosCotizacion, buscarPlatillosItems, obtenerFormatoCotizacion, obtenerUsuarioSesionActual, obtenerEmpresaPorCliente, obtenerGrupoEmpresa, obtenerComplementosPorHotel, obtenerPlatilloItemPorId, obtenerAudiovisualPorHotel } from "@/app/actions/catalogos"
import { listaCategoriaEvento } from "@/app/actions/cotizaciones"
import { Users, MapPin, DollarSign, User, Mail, Phone, Building2, Check, X, CalendarIcon, FileText, UserPlus } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"

import React from "react"
import type { ddlItem } from "@/types/common"

import { useEffect, useState } from "react"
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
  const total = subtotal * (cantidad || 1)
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

export function QuotationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [cotizacionId, setCotizacionId] = useState<number | null>(null)
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
  const [agregarTipo, setAgregarTipo] = useState<string>("")
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
  const [presupuestoItems, setPresupuestoItems] = useState<{ concepto: string; tipo: string; precio: number; iva: number; servicio: number; subtotal: number; cantidad: number; dias: number; total: number }[]>([])
  const [audiovisualItems, setAudiovisualItems] = useState<any[]>([])
  const [showAudiovisualModal, setShowAudiovisualModal] = useState(false)
  const [audiovisualTabla, setAudiovisualTabla] = useState<any[]>([])
  const [loadingAudiovisual, setLoadingAudiovisual] = useState(false)
  const [selectedAudiovisualId, setSelectedAudiovisualId] = useState("")
  const [savingAudiovisual, setSavingAudiovisual] = useState(false)
  const [complementoItems, setComplementoItems] = useState<any[]>([])
  const [showComplementoModal, setShowComplementoModal] = useState(false)
  const [complementoTabla, setComplementoTabla] = useState<any[]>([])
  const [loadingComplemento, setLoadingComplemento] = useState(false)
  const [selectedComplementoId, setSelectedComplementoId] = useState("")
  const [savingComplemento, setSavingComplemento] = useState(false)
  const [compPdfUrl, setCompPdfUrl] = useState("")
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [requiereAutorizacion, setRequiereAutorizacion] = useState<"si" | "no" | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [loadingEditStep, setLoadingEditStep] = useState("")

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    loadHoteles()
    loadClientes()
    listaCategoriaEvento().then(r => { if (r.success && r.data) setCategoriasEvento(r.data as { id: number; nombre: string }[]) })
    listaEstatusCotizacion().then(r => {
      if (r.success && r.data) {
        const lista = r.data as ddlItem[]
        setEstatusList(lista)
        // En modo creación, pre-seleccionar "Borrador" via pending state
        if (!searchParams.get("editId")) {
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

  // Cargar cotización existente si viene editId en URL
  useEffect(() => {
    const editId = searchParams.get("editId")
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

      // En modo edición: mostrar sección de paquete y cargar datos existentes
      setLoadingEditStep("Cargando sede y salon...")
      setCotizacionId(Number(editId))
      setShowPackageSection(true)
      cargarAudiovisualItems(Number(editId))
      cargarComplementoItems(Number(editId))

      // Cargar paquetes del tipo de evento SIN llamar handleTipoEventoChange
      if (tid) {
        setLoadingPaquetes(true)
        listaDesplegablePaquetes(Number(tid)).then((res) => {
          const paquetesList = res.success && res.data ? res.data : []
          setPaquetes(paquetesList)
          setLoadingPaquetes(false)

          // Cargar elementos ya asignados a esta cotización
          setLoadingEditStep("Cargando elementos del paquete...")
          setLoadingElementos(true)
          obtenerPlatillosCotizacion(Number(editId)).then((platRes) => {
            if (platRes.success && platRes.data) setPlatillosItems(platRes.data)
          })
          obtenerElementosCotizacion(Number(editId)).then((elemRes) => {
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
              // Platillos
              obtenerPlatillosCotizacion(Number(editId)).then(async (platPresRes) => {
                if (platPresRes.success && platPresRes.data) {
                  for (const pl of platPresRes.data) {
                    const plTotal = pl.costo ? Number(pl.costo) : 0
                    presItems.push(crearPresupuestoItem(pl.descripcion || pl.nombre || pl.elemento || "", "Platillo", plTotal, dias, 0, numInvitados))
                  }
                }
                // Audiovisual
                const supaCli = (await import("@/lib/supabase/client")).createClient()
                const { data: avElems } = await supaCli.from("elementosxcotizacion").select("*").eq("cotizacionid", Number(editId)).eq("tipoelemento", "AudioVisual")
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
                const { data: compElems } = await supaCli.from("elementosxcotizacion").select("*").eq("cotizacionid", Number(editId)).eq("tipoelemento", "Complemento")
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
              })
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
  }, [searchParams])

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
      const result = await listaDesplegablePaquetes(Number(tipoeventoid))
      if (result.success && result.data) {
        setPaquetes(result.data)
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
      if (platRes.success && platRes.data) setPlatillosItems(platRes.data)
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

  async function handleAbrirAudiovisual() {
    setShowAudiovisualModal(true)
    setSelectedAudiovisualId("")
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
    if (!selectedAudiovisualId || !cotizacionId) return
    setSavingAudiovisual(true)
    const supabase = (await import("@/lib/supabase/client")).createClient()
    const { error } = await supabase.from("elementosxcotizacion").insert({
      cotizacionid: cotizacionId,
      tipoelemento: "AudioVisual",
      elementoid: Number(selectedAudiovisualId),
      hotelid: Number(formData.hotel),
    })
    if (!error) {
      await cargarAudiovisualItems(cotizacionId)
      // Agregar al presupuesto
      const avSeleccionado = audiovisualTabla.find((el: any) => String(el.id) === selectedAudiovisualId)
      if (avSeleccionado) {
        const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
        const avTotal = avSeleccionado.costo ? Number(avSeleccionado.costo) : 0
        setPresupuestoItems(prev => [...prev, crearPresupuestoItem(avSeleccionado.nombre || "Audiovisual", "Audiovisual", avTotal, dias, 0, 1)])
      }
      setShowAudiovisualModal(false)
      setSelectedAudiovisualId("")
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
    await supabase.from("elementosxcotizacion").delete().eq("cotizacionid", cotizacionId).eq("tipoelemento", "AudioVisual").eq("elementoid", elementoid)
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
    const { data: elems } = await supabase.from("elementosxcotizacion").select("*").eq("cotizacionid", cotId).eq("tipoelemento", "AudioVisual")
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
    // Obtener el ID del alimento seleccionado en la cotización
    const alimentoEl = elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
    const alimentoId = alimentoEl ? Number(alimentoEl.elementoid ?? alimentoEl.id) : null
    let query = supabase.from("complementos").select("id, nombre, costo").eq("hotelid", Number(formData.hotel)).eq("activo", true)
    if (alimentoId) {
      query = query.eq("platilloid", alimentoId)
    }
    const { data } = await query.order("nombre")
    if (data) {
      const yaAsignados = new Set(complementoItems.map((el: any) => Number(el.elementoid)))
      setComplementoTabla(data.filter((el: any) => !yaAsignados.has(Number(el.id))))
    }
    setLoadingComplemento(false)
  }

  async function handleAgregarComplemento() {
    if (!selectedComplementoId || !cotizacionId) return
    setSavingComplemento(true)
    const supabase = (await import("@/lib/supabase/client")).createClient()
    const { error } = await supabase.from("elementosxcotizacion").insert({
      cotizacionid: cotizacionId,
      tipoelemento: "Complemento",
      elementoid: Number(selectedComplementoId),
      hotelid: Number(formData.hotel),
    })
    if (!error) {
      await cargarComplementoItems(cotizacionId)
      // Agregar al presupuesto
      const compSeleccionado = complementoTabla.find((el: any) => String(el.id) === selectedComplementoId)
      if (compSeleccionado) {
        const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
        const compTotal = compSeleccionado.costo ? Number(compSeleccionado.costo) : 0
        const numInvitados = Number(formData.numeroInvitados) || 0
        setPresupuestoItems(prev => [...prev, crearPresupuestoItem(compSeleccionado.nombre || "Complemento", "Complemento", compTotal, dias, 0, numInvitados)])
      }
      setShowComplementoModal(false)
      setSelectedComplementoId("")
    } else {
      alert(`Error al agregar complemento: ${error.message}`)
    }
    setSavingComplemento(false)
  }

  async function handleEliminarComplemento(elementoid: number) {
    if (!cotizacionId) return
    // Obtener nombre antes de eliminar para remover del presupuesto
    const compItem = complementoItems.find((el: any) => Number(el.complemento?.id || el.elementoid) === elementoid)
    const nombreComp = compItem?.complemento?.nombre || ""
    const supabase = (await import("@/lib/supabase/client")).createClient()
    await supabase.from("elementosxcotizacion").delete().eq("cotizacionid", cotizacionId).eq("tipoelemento", "Complemento").eq("elementoid", elementoid)
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
    const { data: elems } = await supabase.from("elementosxcotizacion").select("*").eq("cotizacionid", cotId).eq("tipoelemento", "Complemento")
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

      // Obtener nombres de dropdowns
      const salonNombre = salones.find(s => s.value === formData.salon)?.text || ""
      const montajeNombre = montajes.find(m => m.value === formData.montaje)?.text || ""
      const tipoEventoNombre = tiposEvento.find(t => t.value === formData.tipoEvento)?.text || ""
      // Renta del salón desde presupuesto
      const salonPresupuesto = presupuestoItems.find(p => p.tipo === "Salón")
      const rentaSalon = salonPresupuesto ? `$${salonPresupuesto.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "$0.00"

      // Obtener datos del platillo seleccionado y complementos del hotel
      let platilloData: { nombre: string; descripcion: string; costo: number } | null = null
      if (platillosItems.length > 0) {
        const platilloId = Number(platillosItems[0].elementoid ?? platillosItems[0].id)
        const platilloRes = await obtenerPlatilloItemPorId(platilloId)
        if (platilloRes.success && platilloRes.data) platilloData = platilloRes.data as any
      }
      const [complementosRes, audiovisualRes] = await Promise.all([
        obtenerComplementosPorHotel(Number(formData.hotel)),
        obtenerAudiovisualPorHotel(Number(formData.hotel)),
      ])
      const complementosData = complementosRes.success ? complementosRes.data : []
      const audiovisualData = audiovisualRes.success ? audiovisualRes.data : []

      // Formatear fechas
      const formatearFecha = (fecha: string) => {
        if (!fecha) return ""
        const d = new Date(fecha + "T12:00:00")
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]} del ${d.getFullYear()}`
      }
      const fechaTexto = formData.fechaFinal && formData.fechaFinal !== formData.fechaInicial
        ? `${formatearFecha(formData.fechaInicial)} al ${formatearFecha(formData.fechaFinal)}`
        : formatearFecha(formData.fechaInicial)

      // Formatear hora
      const formatearHora = (hora: string) => {
        if (!hora) return ""
        return `${hora} hrs.`
      }
      const horarioTexto = `${formatearHora(formData.horaInicio)} a ${formatearHora(formData.horaFin)}`

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

      // --- Tabla de evento ---
      const tableData = [
        { label: "Fecha:", value: `${fechaTexto}\n(Sujeto a disponibilidad)` },
        { label: "Evento:", value: tipoEventoNombre },
        { label: "Salón:", value: `${salonNombre}\n(Los espacios no han sido reservados) espacios sujetos a disponibilidad, Para garantizar el servicio se requiere la firma de contrato y pago por concepto de anticipo.` },
        { label: "Garantía:", value: `${formData.numeroInvitados} personas` },
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

  async function handleAbrirAgregar(tipo: string, tipoPlatillo: string | null = null) {
    setAgregarTipo(tipo)
    setSelectedElementoId("")
    setElementosTabla([])
    setShowAgregarModal(true)
    setLoadingTabla(true)
    if (tipo === "platillos") {
      // Obtener el platilloid del alimento seleccionado en la sección Alimentos
      const alimentoEl = elementosPaquete.find((el: any) => normalizarSeccion(el.tipoelemento || el.tipo || "") === "alimentos")
      const platilloId = alimentoEl ? Number(alimentoEl.elementoid ?? alimentoEl.id) : -1
      const hotelId = formData.hotel ? Number(formData.hotel) : -1
      const result = await buscarPlatillosItems(platilloId, hotelId, tipoPlatillo)
      if (result.success && result.data) {
        const yaAsignados = new Set(platillosItems.map(el => Number(el.elementoid)))
        setElementosTabla(result.data.filter((el: any) => !yaAsignados.has(Number(el.id))))
      }
    } else {
      const result = tipo === "lugar"
        ? await buscarLugaresPorHotel(Number(formData.hotel))
        : await buscarElementosPorTabla(tipo)
      if (result.success && result.data) {
        const yaAsignados = new Set(
          elementosPaquete
            .filter(el => normalizarSeccion(el.tipoelemento || el.tipo || "") === tipo)
            .map(el => Number(el.elementoid ?? el.id))
        )
        setElementosTabla(result.data.filter((el: any) => !yaAsignados.has(Number(el.id))))
      }
    }
    setLoadingTabla(false)
  }

  async function handleAgregarElemento() {
    if (!selectedElementoId || !cotizacionId) return
    setSavingElemento(true)
    const result = agregarTipo === "lugar"
      ? await modificarLugarCotizacion(cotizacionId, Number(formData.hotel), Number(selectedElementoId))
      : await agregarElementoACotizacion(cotizacionId, Number(formData.hotel), Number(selectedElementoId), agregarTipo)
    if (result.success) {
      const [elementosResult, platRes] = await Promise.all([
        obtenerElementosCotizacion(cotizacionId),
        obtenerPlatillosCotizacion(cotizacionId),
      ])
      if (elementosResult.success && elementosResult.data) setElementosPaquete(elementosResult.data)
      if (platRes.success && platRes.data) setPlatillosItems(platRes.data)
      // Agregar al presupuesto si es platillo (alimentos no van al presupuesto)
      if (agregarTipo === "platillos") {
        const elementoSeleccionado = elementosTabla.find((el: any) => String(el.id) === selectedElementoId)
        if (elementoSeleccionado) {
          const nombreElemento = elementoSeleccionado.descripcion || elementoSeleccionado.nombre || elementoSeleccionado.elemento || ""
          const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
          const elTotal = elementoSeleccionado.costo ? Number(elementoSeleccionado.costo) : 0
          const numInvitados = Number(formData.numeroInvitados) || 0
          setPresupuestoItems(prev => [...prev, crearPresupuestoItem(nombreElemento, "Platillo", elTotal, dias, 0, numInvitados)])
        }
      }
      setShowAgregarModal(false)
      setSelectedElementoId("")
    } else {
      alert(`Error al agregar elemento: ${result.error}`)
    }
    setSavingElemento(false)
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
      setSalones(result.data)
    }
  }

  async function loadMontajes(salonId: string, esModoEdicion = false) {
    const result = await objetoSalon(Number(salonId))

    if (result.success && result.data) {
      // En creación, pre-llenar No. Invitados con capacidadminima del salón
      if (!esModoEdicion && result.data.capacidadminima != null) {
        setFormData(prev => ({ ...prev, adultos: result.data!.capacidadminima!.toString(), ninos: "", numeroInvitados: result.data!.capacidadminima!.toString() }))
      }

      // Cargar montajes
      if (result.data.montajes) {
        const montajesOptions = result.data.montajes
          .filter((m) => m.id && m.montaje)
          .map((m) => ({
            value: m.id!.toString(),
            text: m.montaje!,
          }))
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedClienteId) {
      setLoading(false)
      return
    }

    if (!formData.montaje) {
      alert("Selecciona un montaje antes de crear la cotización.")
      return
    }

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

      const editId = searchParams.get("editId")
      const existingId = editId || cotizacionId?.toString()

      let result
      if (existingId) {
        formDataToSubmit.append("id", existingId)
        formDataToSubmit.append("fechaactualizacion", new Date().toISOString().slice(0, 10))
        formDataToSubmit.append("impuestos", formData.impuestos)
        formDataToSubmit.append("porcentajedescuento", formData.descuentoPorcentaje)
        formDataToSubmit.append("montodescuento", formData.montoDescuento)
        result = await actualizarCotizacion(formDataToSubmit)
        if (result.success) {
          alert("Cotización actualizada correctamente")
        } else {
          alert(`Error al actualizar cotización: ${result.error}`)
        }
      } else {
        result = await crearCotizacion(formDataToSubmit)
        if (result.success) {
          setCotizacionId(result.data)
          setShowPackageSection(true)
          cargarAudiovisualItems(result.data)
          cargarComplementoItems(result.data)
          // Agregar salón al presupuesto
          if (formData.salon) {
            const salonItem = salones.find((s) => s.value === formData.salon)
            const salonResult = await objetoSalon(Number(formData.salon))
            const precioSalon = salonResult.success && salonResult.data?.preciopordia ? Number(salonResult.data.preciopordia) : 0
            const dias = calcularDiasEvento(formData.fechaInicial, formData.fechaFinal)
            setPresupuestoItems([crearPresupuestoItem(salonItem?.text || "Salón", "Salón", precioSalon, dias, 0, 1)])
          }
        } else {
          alert(`Error al crear cotización: ${result.error}`)
        }
      }
    } catch (error) {
      console.error("Error al guardar cotización:", error)
      alert("Error inesperado al guardar la cotización")
    } finally {
      setLoading(false)
    }
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
                      p.tipo === "Platillo" || p.tipo === "Complemento"
                        ? { ...p, cantidad: total, total: p.subtotal * total }
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
                      p.tipo === "Platillo" || p.tipo === "Complemento"
                        ? { ...p, cantidad: total, total: p.subtotal * total }
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
                  disabled={!searchParams.get("editId") && !cotizacionId}
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

              {requerirHabitaciones && (
                <div className="grid grid-cols-3 gap-3 pl-6 border-l-2 border-blue-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Número de Habitaciones</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.numeroHabitaciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, numeroHabitaciones: e.target.value }))}
                      placeholder="Ej: 10"
                      className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                    />
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
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button
          type="submit"
          disabled={loading || !selectedClienteId}
          className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : (searchParams.get("editId") || cotizacionId) ? "Actualizar Cotización" : "Crear Cotización"}
        </Button>
      </div>

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

                  // "platillos" se renderiza como subsección dentro de "alimentos", no como grupo top-level
                  const grupos = Object.entries(grouped).filter(([tipo]) => tipo !== "platillos")
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
                          {items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 group">
                              {(tipo === "alimentos" || tipo === "bebidas" || tipo === "platillos") ? (
                                <button
                                  type="button"
                                  onClick={() => handleVerPDF(Number(item.elementoid ?? item.id), tipo)}
                                  className={`text-sm text-left underline decoration-dotted cursor-pointer ${item.destacado ? "text-[#b87333] hover:text-[#b87333]/70" : "text-[#1a3d2e] hover:text-[#1a3d2e]/70"}`}
                                  title="Ver documento PDF"
                                >
                                  {item.descripcion || item.nombre || item.elemento || ""}
                                </button>
                              ) : (
                                <p className={`text-sm ${item.destacado ? "text-[#b87333]" : "text-gray-600"}`}>
                                  {item.descripcion || item.nombre || item.elemento || ""}
                                </p>
                              )}
                              {tipo !== "lugar" && (
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
                              )}
                            </div>
                          ))}
                          {(tipo !== "lugar" || items.length === 0) && (
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
                          {tipo === "lugar" && items.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAbrirAgregar(tipo)}
                              className="mt-2 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Modificar
                            </button>
                          )}
                        </div>

                        {/* Subsección Platillos dentro de Alimentos */}
                        {tipo === "alimentos" && selectedPaqueteInfo?.tipopaquete === "Completo" && (
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
                                    <button
                                      type="button"
                                      onClick={() => handleAbrirAgregar("platillos", tipoFiltro)}
                                      className="mt-2 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors"
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
                            })}
                          </>
                        )}
                        {tipo === "alimentos" && selectedPaqueteInfo?.tipopaquete !== "Completo" && (
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
                              <button
                                type="button"
                                onClick={() => handleAbrirAgregar("platillos")}
                                className="mt-2 flex items-center gap-1 text-xs text-[#1a3d2e] hover:text-[#1a3d2e]/70 border border-[#1a3d2e]/30 hover:border-[#1a3d2e]/60 rounded px-2 py-1 transition-colors"
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
                      audiovisualItems.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-2 group">
                          <p className="text-sm text-gray-600">{item.audiovisual?.nombre || item.audiovisual?.descripcion || "Elemento"}</p>
                          <button type="button" onClick={() => handleEliminarAudiovisual(Number(item.audiovisual?.id || item.elementoid))} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded flex-shrink-0" title="Eliminar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      ))
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
                      complementoItems.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-2 group">
                          <button
                            type="button"
                            onClick={async () => {
                              setShowPDFModal(true)
                              setPdfModalUrl("")
                              setLoadingPDF(true)
                              const { createClient } = await import("@/lib/supabase/client")
                              const supabase = createClient()
                              const { data } = await supabase.from("complementos").select("imgurl").eq("id", Number(item.complemento?.id || item.elementoid)).maybeSingle()
                              if (data?.imgurl) setPdfModalUrl(data.imgurl)
                              setLoadingPDF(false)
                            }}
                            className="text-sm text-left underline decoration-dotted cursor-pointer text-[#1a3d2e] hover:text-[#1a3d2e]/70"
                            title="Ver documento PDF"
                          >
                            {item.complemento?.nombre || "Elemento"}
                          </button>
                          <button type="button" onClick={() => handleEliminarComplemento(Number(item.complemento?.id || item.elementoid))} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded flex-shrink-0" title="Eliminar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      ))
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Agregar Audiovisual</h2>
              <button type="button" onClick={() => setShowAudiovisualModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {loadingAudiovisual ? (
              <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
            ) : (
              <div className="space-y-3">
                <Label>Elemento Audiovisual</Label>
                <Select value={selectedAudiovisualId} onValueChange={setSelectedAudiovisualId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un elemento" />
                  </SelectTrigger>
                  <SelectContent>
                    {audiovisualTabla.map((el: any) => (
                      <SelectItem key={el.id} value={el.id.toString()}>
                        {el.nombre || el.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAudiovisualModal(false)}>Cancelar</Button>
              <Button type="button" disabled={!selectedAudiovisualId || savingAudiovisual} onClick={handleAgregarAudiovisual} className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white">
                {savingAudiovisual ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Complemento */}
      {showComplementoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Agregar Complemento</h2>
              <button type="button" onClick={() => setShowComplementoModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {loadingComplemento ? (
              <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
            ) : (
              <div className="space-y-3">
                <Label>Complemento</Label>
                <Select value={selectedComplementoId} onValueChange={(val) => {
                  setSelectedComplementoId(val)
                  // Cargar imagen del complemento seleccionado (columna imgurl)
                  if (val) {
                    import("@/lib/supabase/client").then(async ({ createClient }) => {
                      const supabase = createClient()
                      const { data } = await supabase.from("complementos").select("imgurl").eq("id", Number(val)).maybeSingle()
                      setCompPdfUrl(data?.imgurl || "")
                    })
                  } else {
                    setCompPdfUrl("")
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un complemento" />
                  </SelectTrigger>
                  <SelectContent>
                    {complementoTabla.map((el: any) => (
                      <SelectItem key={el.id} value={el.id.toString()}>
                        {el.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {compPdfUrl && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mt-2" style={{ height: "600px" }}>
                    <iframe src={`${compPdfUrl}#navpanes=0`} className="w-full h-full" title="Vista previa PDF" />
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowComplementoModal(false)}>Cancelar</Button>
              <Button type="button" disabled={!selectedComplementoId || savingComplemento} onClick={handleAgregarComplemento} className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white">
                {savingComplemento ? "Agregando..." : "Agregar"}
              </Button>
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
                    <th className="text-right px-3 py-3 font-medium w-24">Servicio</th>
                    <th className="text-right px-3 py-3 font-medium w-28">Subtotal</th>
                    <th className="text-center px-3 py-3 font-medium w-20">Cantidad</th>
                    <th className="text-center px-3 py-3 font-medium w-16">Días</th>
                    <th className="text-right px-3 py-3 font-medium w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestoItems.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-3 py-3 text-gray-900 font-medium">{item.concepto}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.tipo === "Salón" ? "bg-blue-100 text-blue-700" :
                          item.tipo === "Platillo" ? "bg-orange-100 text-orange-700" :
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
                            setPresupuestoItems(prev => prev.map((p, i) => i === index ? { ...p, servicio: val } : p))
                          }}
                          className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a3d2e] focus:border-[#1a3d2e]"
                        />
                      </td>
                      <td className="px-3 py-3 text-right text-gray-900">
                        {item.subtotal > 0 ? `$${item.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "Por definir"}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900">{item.cantidad || "-"}</td>
                      <td className="px-3 py-3 text-center text-gray-900">{item.dias}</td>
                      <td className="px-3 py-3 text-right text-gray-900 font-medium">
                        {item.total > 0 ? `$${item.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "Por definir"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#1a3d2e]/5 border-t-2 border-[#1a3d2e]/20">
                    <td colSpan={9} className="px-3 py-3 text-right font-semibold text-gray-900">Total</td>
                    <td className="px-3 py-3 text-right font-bold text-[#1a3d2e] text-base">
                      {presupuestoItems.reduce((sum, i) => sum + i.total, 0) > 0
                        ? `$${presupuestoItems.reduce((sum, i) => sum + i.total, 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                        : "Por definir"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {cotizacionId && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleGenerarPDF}
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
                      if (!grouped[key]) grouped[key] = []
                      grouped[key].push(el)
                    }
                    return (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {Object.entries(grouped).map(([tipo, items]) => (
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

      {/* Modal Agregar Elemento */}
      {showAgregarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {agregarTipo === "lugar" ? "Modificar lugar" : `Agregar elemento — ${agregarTipo}`}
              </h2>
              <button
                type="button"
                onClick={() => setShowAgregarModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium capitalize">{agregarTipo}</Label>
              {loadingTabla ? (
                <p className="text-sm text-gray-500">Cargando elementos...</p>
              ) : elementosTabla.length === 0 ? (
                <p className="text-sm text-gray-400">Todos los elementos de esta sección ya están agregados.</p>
              ) : (
                <Select
                  value={selectedElementoId}
                  onValueChange={(val) => setSelectedElementoId(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecciona un elemento de ${agregarTipo}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {elementosTabla.map((el) => (
                      <SelectItem key={el.id} value={el.id.toString()}>
                        {el.nombre || el.descripcion || el.name || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Preview PDF inline al seleccionar elemento en Alimentos o Bebidas */}
            {(agregarTipo === "alimentos" || agregarTipo === "bebidas" || agregarTipo === "platillos") && selectedElementoId && (() => {
              const el = elementosTabla.find((e: any) => e.id.toString() === selectedElementoId)
              const pdf = el?.documentopdf
              return pdf ? (
                <div className="border rounded-lg overflow-hidden" style={{ height: "600px" }}>
                  <iframe src={`${pdf}#navpanes=0`} className="w-full h-full" title="Vista previa PDF" />
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Este elemento no tiene PDF asociado.</p>
              )
            })()}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAgregarModal(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!selectedElementoId || savingElemento}
                onClick={handleAgregarElemento}
                className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white"
              >
                {savingElemento ? "Guardando..." : agregarTipo === "lugar" ? "Modificar" : "Agregar"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
