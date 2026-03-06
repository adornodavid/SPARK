"use client"

import { CardDescription } from "@/components/ui/card"
import { listaDesplegableClientes, objetoCliente } from "@/app/actions/clientes"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones, objetoSalon, objetoSalones } from "@/app/actions/salones"
import { crearCotizacion, actualizarCotizacion, objetoCotizacion } from "@/app/actions/cotizaciones"
import { obtenerDisponibilidadSalon, obtenerReservacionesPorDia } from "@/app/actions/reservaciones"
import { listaDesplegableTipoEvento, listaDesplegablePaquetes, obtenerElementosPaquete, obtenerElementosCotizacion, asignarPaqueteACotizacion, eliminarElementoCotizacion, limpiarElementosCotizacion, buscarElementosPorTabla, agregarElementoACotizacion, buscarLugaresPorHotel, modificarLugarCotizacion, listaEstatusCotizacion, obtenerDocumentoPDF, obtenerPlatillosCotizacion, buscarPlatillosItems } from "@/app/actions/catalogos"
import { listaCategoriaEvento } from "@/app/actions/cotizaciones"
import { Users, MapPin, DollarSign, User, Mail, Phone, Building2, Check, X, CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"

import React from "react"
import type { ddlItem } from "@/types" // Import ddlItem type

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
  servicio: "servicio",
}
function normalizarSeccion(tipo: string): string {
  const lower = tipo.toLowerCase().trim()
  return TIPO_A_SECCION[lower] ?? lower
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
  const [clientes, setClientes] = useState<Array<{ value: string; text: string }>>([])
  const [filteredClientes, setFilteredClientes] = useState<Array<{ value: string; text: string }>>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState<string>("")
  const [showPackageSection, setShowPackageSection] = useState(false)
  const [cotizacionId, setCotizacionId] = useState<number | null>(null)
  const [tiposEvento, setTiposEvento] = useState<ddlItem[]>([])
  const [categoriasEvento, setCategoriasEvento] = useState<string[]>([])
  const [estatusList, setEstatusList] = useState<ddlItem[]>([])
  const [showPaqueteModal, setShowPaqueteModal] = useState(false)
  const [showLimpiarModal, setShowLimpiarModal] = useState(false)
  const [limpiarLoading, setLimpiarLoading] = useState(false)
  const [elementosPreviewPaquete, setElementosPreviewPaquete] = useState<any[]>([])
  const [loadingPreviewPaquete, setLoadingPreviewPaquete] = useState(false)
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
    // Event Details
    nombreEvento: "",
    categoriaEvento: "",
    tipoEvento: "",
    estatusId: "",
    numeroInvitados: "",
    numeroHabitaciones: "",
    // Client Information
    nombreCliente: "",
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
    loadTiposEvento()
    listaCategoriaEvento().then(r => { if (r.success && r.data) setCategoriasEvento(r.data) })
    listaEstatusCotizacion().then(r => { if (r.success && r.data) setEstatusList(r.data as ddlItem[]) })
  }, [])


  // Cargar cotización existente si viene editId en URL
  useEffect(() => {
    const editId = searchParams.get("editId")
    if (!editId) return

    async function cargarCotizacion() {
      const result = await objetoCotizacion(Number(editId))
      if (!result.success || !result.data) return
      const c = result.data

      const fi   = c.fechainicio?.slice(0, 10) ?? ""
      const ff   = c.fechafin?.slice(0, 10)   ?? ""
      const hi   = c.horainicio?.slice(0, 5)  ?? ""
      const hf   = c.horafin?.slice(0, 5)     ?? ""
      const tid  = c.tipoeventoid?.toString() ?? c.tipoevento?.toString() ?? ""
      const mid  = c.montajeid?.toString()    ?? ""

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
        nombreEvento:        c.nombreevento              ?? "",
        categoriaEvento:     c.categoriaevento           ?? "",
        tipoEvento:          tid,
        estatusId:           c.estatusid?.toString()     ?? "",
        numeroInvitados:     c.numeroinvitados?.toString() ?? "",
        numeroHabitaciones:  c.numerohabitaciones?.toString() ?? "",
        nombreCliente:       c.cliente                  ?? "",
        email:               c.email                    ?? "",
        telefono:            c.telefono                 ?? "",
        subtotal:            c.subtotal?.toString()     ?? "",
        impuestos:           c.impuestos?.toString()    ?? "",
        descuentoPorcentaje: c.porcentajedescuento?.toString() ?? "",
        montoDescuento:      c.montodescuento?.toString() ?? "",
        totalMonto:          c.totalmonto?.toString()   ?? "",
      })

      // Calendario visual
      if (fi && ff) {
        setCalendarRange({
          from: new Date(fi + "T12:00:00"),
          to: new Date(ff + "T12:00:00"),
        })
      }

      // Cargar salones → setear salon → luego montajes
      if (c.hotelid) {
        loadSalones(c.hotelid.toString()).then(() => {
          if (salonId) setFormData(prev => ({ ...prev, salon: salonId }))
          if (c.salonid) {
            loadMontajes(c.salonid.toString()).then(() => {
              if (mid) setFormData(prev => ({ ...prev, montaje: mid }))
            })
          }
        })
      }

      // En modo edición: mostrar sección de paquete y cargar datos existentes
      setCotizacionId(Number(editId))
      setShowPackageSection(true)

      // Cargar paquetes del tipo de evento SIN llamar handleTipoEventoChange
      if (tid) {
        setLoadingPaquetes(true)
        listaDesplegablePaquetes(Number(tid)).then((res) => {
          const paquetesList = res.success && res.data ? res.data : []
          setPaquetes(paquetesList)
          setLoadingPaquetes(false)

          // Cargar elementos ya asignados a esta cotización
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
            setLoadingElementos(false)
          })
        })
      }

      if (c.clienteid) setSelectedClienteId(c.clienteid.toString())
    }

    cargarCotizacion()
  }, [searchParams])

  useEffect(() => {
    if (hasLoadedFromParams) return

    const hotelId = searchParams.get("hotelId")
    const salonId = searchParams.get("salonId")

    if (hotelId) {
      console.log("[v0] Prefilling hotel:", hotelId)
      setPendingHotelId(hotelId)

      if (salonId) {
        console.log("[v0] Setting pending salonId:", salonId)
        setPendingSalonId(salonId)
      }

      setHasLoadedFromParams(true)
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
        loadMontajes(pendingSalonId).then(() => {
          if (pendingMontajeId) {
            setFormData((prev) => ({ ...prev, montaje: pendingMontajeId }))
            setPendingMontajeId(null)
          }
        })
        setPendingSalonId(null)
      }
    }
  }, [salones, pendingSalonId])



  async function loadTiposEvento() {
    const result = await listaDesplegableTipoEvento()
    if (result.success && result.data) {
      setTiposEvento(result.data)
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
    setSelectedPaqueteId(paqueteid)
    setSelectedPaqueteInfo(null)
    setElementosPreviewPaquete([])
    if (paqueteid) {
      const paquete = paquetes.find((p) => p.paqueteid?.toString() === paqueteid || p.id?.toString() === paqueteid)
      setSelectedPaqueteInfo(paquete || null)
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
      const [elementosResult, platRes] = await Promise.all([
        obtenerElementosCotizacion(cotizacionId),
        obtenerPlatillosCotizacion(cotizacionId),
      ])
      if (elementosResult.success && elementosResult.data) setElementosPaquete(elementosResult.data)
      if (platRes.success && platRes.data) setPlatillosItems(platRes.data)
    } else {
      alert(`Error al eliminar: ${result.error}`)
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

  async function handleAbrirAgregar(tipo: string) {
    setAgregarTipo(tipo)
    setSelectedElementoId("")
    setElementosTabla([])
    setShowAgregarModal(true)
    setLoadingTabla(true)
    if (tipo === "platillos") {
      const result = await buscarPlatillosItems()
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
      setShowAgregarModal(false)
      setSelectedElementoId("")
    } else {
      alert(`Error al agregar elemento: ${result.error}`)
    }
    setSavingElemento(false)
  }

  async function handleConfirmPaquete() {
    if (!selectedPaqueteId || !cotizacionId) return
    if (elementosPaquete.length > 0) {
      setShowConfirmReemplazarModal(true)
      return
    }
    await ejecutarAsignarPaquete()
  }

  async function ejecutarAsignarPaquete() {
    if (!selectedPaqueteId || !cotizacionId) return
    setShowConfirmReemplazarModal(false)
    setAssigningPaquete(true)
    try {
      await limpiarElementosCotizacion(cotizacionId)
      const result = await asignarPaqueteACotizacion(cotizacionId, Number(selectedPaqueteId), Number(formData.hotel))
      if (result.success) {
        const elementosResult = await obtenerElementosCotizacion(cotizacionId)
        if (elementosResult.success && elementosResult.data) {
          setElementosPaquete(elementosResult.data)
        }
        setShowPaqueteModal(false)
        setSelectedPaqueteId("")
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

  async function loadMontajes(salonId: string) {
    const result = await objetoSalon(Number(salonId))

    if (result.success && result.data) {
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

  const handleClienteInputChange = (value: string) => {
    setSelectedClienteId("") // invalidar selección al tipear manualmente
    if (value.trim() === "") {
      setFormData(prev => ({ ...prev, nombreCliente: "", email: "", telefono: "" }))
      setFilteredClientes(clientes)
      setShowClienteDropdown(false)
      setSelectedClienteId("")
      return
    }

    setFormData(prev => ({ ...prev, nombreCliente: value }))
    const searchTerm = value.toLowerCase()
    const filtered = clientes.filter((cliente) => cliente.text.toLowerCase().includes(searchTerm))

    setFilteredClientes(filtered)
    setShowClienteDropdown(filtered.length > 0)
  }

  const handleClienteSelect = async (cliente: { value: string; text: string }) => {
    setFormData(prev => ({ ...prev, nombreCliente: cliente.text }))
    setSelectedClienteId(cliente.value)
    setShowClienteDropdown(false)

    // Fetch client details to autofill email and telefono
    try {
      const result = await objetoCliente(Number.parseInt(cliente.value))
      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          nombreCliente: cliente.text,
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
      formDataToSubmit.append("tipoevento", formData.tipoEvento)
      formDataToSubmit.append("totalmonto", formData.totalMonto)
      formDataToSubmit.append("horainicio", formData.horaInicio)
      formDataToSubmit.append("horafin", formData.horaFin)
      formDataToSubmit.append("subtotal", formData.subtotal)
      formDataToSubmit.append("impuestos", formData.impuestos)
      formDataToSubmit.append("porcentajedescuento", formData.descuentoPorcentaje)
      formDataToSubmit.append("montodescuento", formData.montoDescuento)
      formDataToSubmit.append("estatusid", formData.estatusId)
      formDataToSubmit.append("categoriaevento", formData.categoriaEvento)
      formDataToSubmit.append("clienteid", selectedClienteId)

      const editId = searchParams.get("editId")

      let result
      if (editId) {
        formDataToSubmit.append("id", editId)
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
                  placeholder="Escribe para buscar cliente..."
                  className={`border-blue-200 focus:ring-blue-500 ${formData.nombreCliente && !selectedClienteId ? "border-red-400 focus:ring-red-400" : ""}`}
                  autoComplete="off"
                />
                {formData.nombreCliente && !selectedClienteId && (
                  <p className="text-xs text-red-500 mt-1">Cliente no válido. Debes seleccionar uno del listado.</p>
                )}
                {showClienteDropdown && filteredClientes.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-blue-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClientes.map((cliente) => (
                      <button
                        key={cliente.value}
                        type="button"
                        onClick={() => handleClienteSelect(cliente)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-blue-100 last:border-b-0"
                      >
                        <span className="text-sm text-gray-800">{cliente.text}</span>
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
            </div>
          </div>

          {/* Selección de Espacio y Fechas — altura fija */}
          <div className="border-t pt-3">
            <div className="grid md:grid-cols-2 gap-4" style={{ minHeight: "410px" }}>

              {/* LEFT — Inputs: Hotel, Salón, Montaje + Calendario + Fechas */}
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">

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

                {/* Salón + Montaje en la misma fila */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Salón <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.salon}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, salon: value, montaje: "" }))
                        setMontajes([])
                        loadMontajes(value)
                      }}
                      disabled={!formData.hotel}
                      required
                    >
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <SelectValue placeholder={formData.hotel ? "Selecciona un salón" : "Selecciona hotel primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {salones.map((salon) => (
                          <SelectItem key={salon.value} value={salon.value}>{salon.text}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Montaje</Label>
                    <Select
                      value={formData.montaje}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, montaje: value }))}
                      disabled={!formData.salon}
                    >
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
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

                {/* Calendario + Panel de reservaciones del día */}
                <div className="border border-blue-100 rounded-lg bg-blue-50/50 overflow-hidden">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-blue-100 bg-blue-50">
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                      {!formData.fechaInicial
                        ? "Selecciona fecha de inicio"
                        : !formData.fechaFinal
                        ? "Selecciona fecha de fin"
                        : "Rango seleccionado"}
                    </span>
                  </div>
                  <div className="flex">
                    {/* Calendario */}
                    <div className="flex-shrink-0 [&_.rdp]:p-2 [&_.rdp-months]:flex [&_.rdp-months]:flex-row [&_.rdp-months]:gap-4">
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        selected={calendarRange}
                        onSelect={(range) => {
                          setCalendarRange(range)
                          if (range?.from) {
                            const from = range.from
                            const yyyy = from.getFullYear()
                            const mm = String(from.getMonth() + 1).padStart(2, "0")
                            const dd = String(from.getDate()).padStart(2, "0")
                            setFormData((prev) => ({ ...prev, fechaInicial: `${yyyy}-${mm}-${dd}`, fechaFinal: "" }))
                          }
                          if (range?.to) {
                            const to = range.to
                            const yyyy = to.getFullYear()
                            const mm = String(to.getMonth() + 1).padStart(2, "0")
                            const dd = String(to.getDate()).padStart(2, "0")
                            setFormData((prev) => ({ ...prev, fechaFinal: `${yyyy}-${mm}-${dd}` }))
                          }
                        }}
                        onDayClick={(day) => {
                          if (!formData.salon) return
                          const dateStr = toLocalDateStr(day)
                          setDiaSeleccionado(dateStr)
                          setLoadingResDia(true)
                          obtenerReservacionesPorDia(dateStr, Number(formData.salon)).then((res) => {
                            setReservacionesDia(res.data ?? [])
                            setLoadingResDia(false)
                          })
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || isDayFullyBooked(date)}
                        modifiers={{ ocupado: (date) => !isDayFullyBooked(date) && getBlockedIndices(toLocalDateStr(date)).size > 0 }}
                        modifiersClassNames={{ ocupado: "bg-orange-100 text-orange-700 font-semibold" }}
                      />
                    </div>

                    {/* Panel de reservaciones del día seleccionado */}
                    <div className="flex-1 border-l border-blue-100 bg-white min-w-[180px] max-w-[220px]">
                      {!formData.salon ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                          <p className="text-xs text-blue-300">Selecciona un salón para ver reservaciones</p>
                        </div>
                      ) : !diaSeleccionado ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center gap-2">
                          <CalendarIcon className="w-6 h-6 text-blue-200" />
                          <p className="text-xs text-blue-300">Haz clic en un día para ver sus reservaciones</p>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full">
                          {/* Encabezado del día */}
                          <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                            <p className="text-xs font-bold text-blue-800">
                              {new Date(diaSeleccionado + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                            </p>
                            <p className="text-[10px] text-blue-500">{loadingResDia ? "Cargando..." : `${reservacionesDia.length} reservación${reservacionesDia.length !== 1 ? "es" : ""}`}</p>
                          </div>

                          {/* Lista */}
                          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                            {loadingResDia ? (
                              <div className="flex items-center justify-center py-6">
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : reservacionesDia.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-6 text-center gap-1">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-green-600"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                                <p className="text-[10px] text-green-600 font-medium">Día disponible</p>
                              </div>
                            ) : (
                              reservacionesDia.map((r, i) => {
                                const hi = r.horainicio?.slice(0, 5) ?? ""
                                const hf = r.horafin?.slice(0, 5) ?? ""
                                const fi = r.fechainicio?.slice(0, 10) ?? ""
                                const ff = r.fechafin?.slice(0, 10) ?? ""
                                const estatusColor =
                                  r.estatus?.toLowerCase().includes("confirm") ? "bg-green-100 text-green-700" :
                                  r.estatus?.toLowerCase().includes("cancel") ? "bg-red-100 text-red-700" :
                                  "bg-yellow-100 text-yellow-700"
                                return (
                                  <div key={i} className="bg-blue-50 border border-blue-100 rounded-md p-2 space-y-1">
                                    <div className="flex items-start justify-between gap-1">
                                      <p className="text-[10px] font-semibold text-blue-900 leading-tight truncate">{r.salon}</p>
                                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${estatusColor}`}>
                                        {r.estatus}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-blue-600">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5 flex-shrink-0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                      <span>{fi} → {ff}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-blue-600">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                      <span>{hi} – {hf}</span>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fechas y Horarios */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Fecha Inicio <span className="text-red-500">*</span></Label>
                    <Input
                      id="fechaInicial"
                      type="date"
                      value={formData.fechaInicial}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, fechaInicial: e.target.value }))
                        if (e.target.value) {
                          setCalendarRange((prev) => ({ from: new Date(e.target.value + "T00:00:00"), to: prev?.to }))
                        }
                      }}
                      className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Fecha Fin <span className="text-red-500">*</span></Label>
                    <Input
                      id="fechaFinal"
                      type="date"
                      value={formData.fechaFinal}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, fechaFinal: e.target.value }))
                        if (e.target.value) {
                          setCalendarRange((prev) => ({ from: prev?.from, to: new Date(e.target.value + "T00:00:00") }))
                        }
                      }}
                      className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Hora Inicio <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.horaInicio}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, horaInicio: value }))}
                      required
                    >
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm">
                        <SelectValue placeholder="Selecciona hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {HORARIOS_EVENTO.map((h, idx) => (
                          <SelectItem key={h.value} value={h.value} disabled={blockedIndices.has(idx)}>
                            {h.label}{blockedIndices.has(idx) ? " — ocupado" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Hora Fin <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.horaFin}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, horaFin: value }))}
                      required
                    >
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm">
                        <SelectValue placeholder="Selecciona hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {HORARIOS_EVENTO.map((h, idx) => {
                          const isBlocked = blockedIndices.has(idx)
                          const isBeforeInicio = horaInicioIdx >= 0 && idx <= horaInicioIdx
                          return (
                            <SelectItem key={h.value} value={h.value} disabled={isBlocked || isBeforeInicio}>
                              {h.label}{isBlocked ? " — ocupado" : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>

              {/* RIGHT — Galería de fotos del salón, altura fija */}
              <div className="relative rounded-xl overflow-hidden bg-blue-50 border border-blue-100 flex flex-col h-full">
                {formData.salon && salonFotos.length > 0 ? (
                  <>
                    <div className="relative flex-1 overflow-hidden group">
                      <img
                        src={salonFotos[currentPhotoIndex]}
                        alt={`Foto ${currentPhotoIndex + 1} del salón`}
                        className="absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                        onClick={() => setShowPhotoModal(true)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      {/* Ícono expandir */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                          </svg>
                        </div>
                      </div>
                      {/* Dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {salonFotos.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentPhotoIndex(i)}
                            className={`h-1.5 rounded-full transition-all ${i === currentPhotoIndex ? "bg-white w-5" : "bg-white/50 w-1.5"}`}
                          />
                        ))}
                      </div>
                      {/* Prev/Next */}
                      {salonFotos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setCurrentPhotoIndex((p) => (p === 0 ? salonFotos.length - 1 : p - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-colors z-10"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-blue-700"><polyline points="15 18 9 12 15 6" /></svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentPhotoIndex((p) => (p === salonFotos.length - 1 ? 0 : p + 1))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-colors z-10"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-blue-700"><polyline points="9 18 15 12 9 6" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                    <div className="px-3 py-2 text-xs text-blue-600 font-medium text-center bg-white flex-shrink-0">
                      {currentPhotoIndex + 1} / {salonFotos.length} fotos
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-blue-300">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-400">
                        {!formData.hotel ? "Selecciona un hotel" : !formData.salon ? "Selecciona un salón" : "Sin fotos disponibles"}
                      </p>
                      <p className="text-xs text-blue-300 mt-1">
                        {!formData.hotel ? "para ver los salones disponibles" : !formData.salon ? "para ver su galería de fotos" : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Event Details */}
          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Información del Evento</h3>
            <div className="flex flex-wrap gap-5">
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

              <div className="space-y-1 w-48">
                <Label htmlFor="categoriaEvento" className="text-xs font-medium">
                  Categoría del Evento
                </Label>
                <Select value={formData.categoriaEvento} onValueChange={(v) => setFormData(prev => ({ ...prev, categoriaEvento: v }))}>
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm w-full">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasEvento.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-48">
                <Label htmlFor="tipoEvento" className="text-xs font-medium">
                  Tipo de Evento <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.tipoEvento} onValueChange={handleTipoEventoChange} required>
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500 h-8 text-sm w-full">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEvento.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.text}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 w-48">
                <Label htmlFor="estatus" className="text-xs font-medium">
                  Estatus
                </Label>
                <Select value={formData.estatusId} onValueChange={(v) => setFormData(prev => ({ ...prev, estatusId: v }))}>
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

              <div className="space-y-1 w-36">
                <Label htmlFor="numeroInvitados" className="text-xs font-medium">
                  No. Invitados <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numeroInvitados"
                  type="number"
                  min="1"
                  max="999"
                  maxLength={3}
                  value={formData.numeroInvitados}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 3)
                    setFormData(prev => ({ ...prev, numeroInvitados: val }))
                  }}
                  placeholder="Ej: 150"
                  className="border-blue-200 focus:ring-blue-500 h-8 text-sm"
                  required
                />
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button
          type="submit"
          disabled={loading || !selectedClienteId || (!searchParams.get("editId") && !!cotizacionId)}
          className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : searchParams.get("editId") ? "Actualizar Cotización" : "Crear Cotización"}
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
                        {tipo === "alimentos" && (
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
          </CardContent>
        </Card>
      )}

      {cotizacionId && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => router.push(`/cotizaciones/resumen?id=${cotizacionId}`)}
            className="min-w-[140px] bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white"
          >
            Ver Resumen
          </Button>
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
                onClick={() => { setShowPaqueteModal(false); setElementosPreviewPaquete([]) }}
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
                <Select value={selectedPaqueteId} onValueChange={handlePaqueteChange}>
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
            {selectedPaqueteId && (
              <div className="border rounded-lg bg-[#f7f5f0] overflow-hidden">
                {/* Header con nombre y precio */}
                {selectedPaqueteInfo && (
                  <div className="px-4 py-3 border-b border-[#1a3d2e]/10 bg-[#1a3d2e]/5">
                    <p className="text-sm font-bold text-[#1a3d2e] uppercase tracking-wide">
                      {selectedPaqueteInfo.nombre || selectedPaqueteInfo.name}
                    </p>
                    {(selectedPaqueteInfo.precio2025 || selectedPaqueteInfo.precio2026 || selectedPaqueteInfo.precio) && (
                      <p className="text-xs text-[#1a3d2e]/70 mt-0.5">
                        {selectedPaqueteInfo.precio2025
                          ? `$${selectedPaqueteInfo.precio2025} (2025)`
                          : selectedPaqueteInfo.precio2026
                          ? `$${selectedPaqueteInfo.precio2026} (2026)`
                          : `$${selectedPaqueteInfo.precio}`}
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
              <Button type="button" variant="outline" onClick={() => { setShowPaqueteModal(false); setElementosPreviewPaquete([]) }}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!selectedPaqueteId || assigningPaquete || loadingPreviewPaquete}
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
      `}</style>
    </form>
  )
}
