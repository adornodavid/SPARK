"use client"

import { CardDescription } from "@/components/ui/card"
import { listaDesplegableClientes, objetoCliente } from "@/app/actions/clientes"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones, objetoSalon } from "@/app/actions/salones"
import { listaDesplegableTipoEvento, listaDesplegablePaquetes, obtenerElementosPaquete, obtenerElementosCotizacion, asignarPaqueteACotizacion, eliminarElementoCotizacion, buscarElementosPorTabla, agregarElementoACotizacion } from "@/app/actions/catalogos"
import { Users, MapPin, DollarSign, User, Mail, Phone, Building2, Check, X } from "lucide-react"

import React from "react"
import type { ddlItem } from "@/types/common"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuotationEditFormProps {
  cotizacion: any
  elementosIniciales: any[]
  cotizacionId: number
}

export function QuotationEditForm({ cotizacion, elementosIniciales, cotizacionId }: QuotationEditFormProps) {
  const [loading, setLoading] = useState(false)
  const [hoteles, setHoteles] = useState<ddlItem[]>([])
  const [salones, setSalones] = useState<ddlItem[]>([])
  const [montajes, setMontajes] = useState<{ value: string; text: string }[]>([])
  const [clientes, setClientes] = useState<Array<{ value: string; text: string }>>([])
  const [filteredClientes, setFilteredClientes] = useState<Array<{ value: string; text: string }>>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState<string>(cotizacion.clienteid?.toString() ?? "")
  const [tiposEvento, setTiposEvento] = useState<ddlItem[]>([])
  const [showPaqueteModal, setShowPaqueteModal] = useState(false)
  const [paquetes, setPaquetes] = useState<any[]>([])
  const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>("")
  const [selectedPaqueteInfo, setSelectedPaqueteInfo] = useState<any>(null)
  const [elementosPaquete, setElementosPaquete] = useState<any[]>(elementosIniciales)
  const [loadingPaquetes, setLoadingPaquetes] = useState(false)
  const [loadingElementos, setLoadingElementos] = useState(false)
  const [assigningPaquete, setAssigningPaquete] = useState(false)
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [agregarTipo, setAgregarTipo] = useState<string>("")
  const [elementosTabla, setElementosTabla] = useState<any[]>([])
  const [loadingTabla, setLoadingTabla] = useState(false)
  const [selectedElementoId, setSelectedElementoId] = useState<string>("")
  const [savingElemento, setSavingElemento] = useState(false)

  const [formData, setFormData] = useState({
    hotel: cotizacion.hotelid?.toString() ?? "",
    salon: cotizacion.salonid?.toString() ?? "",
    montaje: cotizacion.montajeid?.toString() ?? "",
    fechaInicial: cotizacion.fechainicio ?? "",
    fechaFinal: cotizacion.fechafin ?? "",
    horaInicio: cotizacion.horainicio ?? "",
    horaFin: cotizacion.horafin ?? "",
    nombreEvento: cotizacion.nombreevento ?? "",
    numeroInvitados: cotizacion.numeroinvitados?.toString() ?? "",
    numeroHabitaciones: "",
    tipoEvento: cotizacion.tipoeventoid?.toString() ?? cotizacion.tipoevento?.toString() ?? "",
    nombreCliente: cotizacion.cliente ?? "",
    email: cotizacion.email ?? "",
    telefono: cotizacion.telefono ?? "",
    subtotal: cotizacion.subtotal?.toString() ?? "",
    impuestos: cotizacion.impuestos?.toString() ?? "",
    descuentoPorcentaje: cotizacion.porcentajedescuento?.toString() ?? "",
    montoDescuento: cotizacion.montodescuento?.toString() ?? "",
    totalMonto: cotizacion.totalmonto?.toString() ?? "",
  })

  useEffect(() => {
    loadHoteles()
    loadClientes()
    loadTiposEvento()
    if (cotizacion.hotelid) loadSalones(cotizacion.hotelid.toString())
    if (cotizacion.salonid) loadMontajes(cotizacion.salonid.toString())
    if (cotizacion.tipoeventoid || cotizacion.tipoevento) {
      const tid = cotizacion.tipoeventoid ?? cotizacion.tipoevento
      loadPaquetesPorTipo(tid.toString())
    }
  }, [])

  async function loadTiposEvento() {
    const result = await listaDesplegableTipoEvento()
    if (result.success && result.data) setTiposEvento(result.data)
  }

  async function loadPaquetesPorTipo(tipoeventoid: string) {
    if (!tipoeventoid) return
    setLoadingPaquetes(true)
    const result = await listaDesplegablePaquetes(Number(tipoeventoid))
    if (result.success && result.data) setPaquetes(result.data)
    setLoadingPaquetes(false)
  }

  async function handleTipoEventoChange(tipoeventoid: string) {
    setFormData({ ...formData, tipoEvento: tipoeventoid })
    setSelectedPaqueteId("")
    setSelectedPaqueteInfo(null)
    setPaquetes([])
    loadPaquetesPorTipo(tipoeventoid)
  }

  async function handlePaqueteChange(paqueteid: string) {
    setSelectedPaqueteId(paqueteid)
    setSelectedPaqueteInfo(null)
    if (paqueteid) {
      setLoadingElementos(true)
      const paquete = paquetes.find((p) => p.paqueteid?.toString() === paqueteid || p.id?.toString() === paqueteid)
      setSelectedPaqueteInfo(paquete || null)
      setLoadingElementos(false)
    }
  }

  async function handleEliminarElemento(tipoelemento: string, elementoid: number) {
    const result = await eliminarElementoCotizacion(cotizacionId, tipoelemento, elementoid)
    if (result.success) {
      const elementosResult = await obtenerElementosCotizacion(cotizacionId)
      if (elementosResult.success && elementosResult.data) setElementosPaquete(elementosResult.data)
    } else {
      alert(`Error al eliminar: ${result.error}`)
    }
  }

  async function handleAbrirAgregar(tipo: string) {
    setAgregarTipo(tipo)
    setSelectedElementoId("")
    setElementosTabla([])
    setShowAgregarModal(true)
    setLoadingTabla(true)
    const result = await buscarElementosPorTabla(tipo)
    if (result.success && result.data) setElementosTabla(result.data)
    setLoadingTabla(false)
  }

  async function handleAgregarElemento() {
    if (!selectedElementoId) return
    setSavingElemento(true)
    const result = await agregarElementoACotizacion(
      cotizacionId,
      Number(formData.hotel),
      Number(selectedElementoId),
      agregarTipo
    )
    if (result.success) {
      const elementosResult = await obtenerElementosCotizacion(cotizacionId)
      if (elementosResult.success && elementosResult.data) setElementosPaquete(elementosResult.data)
      setShowAgregarModal(false)
      setSelectedElementoId("")
    } else {
      alert(`Error al agregar elemento: ${result.error}`)
    }
    setSavingElemento(false)
  }

  async function handleConfirmPaquete() {
    if (!selectedPaqueteId) return
    setAssigningPaquete(true)
    try {
      const result = await asignarPaqueteACotizacion(cotizacionId, Number(selectedPaqueteId), Number(formData.hotel))
      if (result.success) {
        const elementosResult = await obtenerElementosCotizacion(cotizacionId)
        if (elementosResult.success && elementosResult.data) setElementosPaquete(elementosResult.data)
        setShowPaqueteModal(false)
        setSelectedPaqueteId("")
        alert("Paquete asignado exitosamente")
      } else {
        alert(`Error al asignar paquete: ${result.error}`)
      }
    } catch (error) {
      alert("Error inesperado al asignar el paquete")
    } finally {
      setAssigningPaquete(false)
    }
  }

  async function loadHoteles() {
    const result = await listaDesplegableHoteles()
    if (result.success && result.data) setHoteles(result.data)
  }

  async function loadSalones(hotelId: string) {
    const result = await listaDesplegableSalones(-1, "", Number(hotelId))
    if (result.success && result.data) setSalones(result.data)
  }

  async function loadMontajes(salonId: string) {
    const result = await objetoSalon(Number(salonId))
    if (result.success && result.data && result.data.montajes) {
      const montajesOptions = result.data.montajes
        .filter((m: any) => m.activo && m.id && m.montaje)
        .map((m: any) => ({ value: m.id!.toString(), text: m.montaje! }))
      setMontajes(montajesOptions)
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
    setFormData({ ...formData, nombreCliente: value })
    if (value.trim() === "") {
      setFilteredClientes(clientes)
      setShowClienteDropdown(false)
      setSelectedClienteId("")
      return
    }
    const filtered = clientes.filter((c) => c.text.toLowerCase().includes(value.toLowerCase()))
    setFilteredClientes(filtered)
    setShowClienteDropdown(filtered.length > 0)
  }

  const handleClienteSelect = async (cliente: { value: string; text: string }) => {
    setFormData({ ...formData, nombreCliente: cliente.text })
    setSelectedClienteId(cliente.value)
    setShowClienteDropdown(false)
    try {
      const result = await objetoCliente(Number.parseInt(cliente.value))
      if (result.success && result.data) {
        setFormData((prev) => ({ ...prev, nombreCliente: cliente.text, email: result.data.email || "", telefono: result.data.telefono || "" }))
      }
    } catch (error) {
      console.error("Error fetching client details:", error)
    }
  }

  return (
    <form className="space-y-8">
      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Selección de Espacio</CardTitle>
          </div>
          <CardDescription>Elige el hotel, salón, tipo de montaje y datos del cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">

          <div className="grid md:grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label htmlFor="hotel" className="text-sm font-medium">
                Hotel <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.hotel}
                onValueChange={(value) => {
                  setFormData({ ...formData, hotel: value, salon: "", montaje: "" })
                  setSalones([])
                  setMontajes([])
                  loadSalones(value)
                }}
              >
                <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                  <SelectValue placeholder="Selecciona un hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>{hotel.text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Información del Evento</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nombreEvento" className="text-sm font-medium">
                  Nombre del Evento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombreEvento"
                  type="text"
                  value={formData.nombreEvento}
                  onChange={(e) => setFormData({ ...formData, nombreEvento: e.target.value })}
                  placeholder="Ej: Boda de Juan y María"
                  className="border-blue-200 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoEvento" className="text-sm font-medium">
                  Tipo de Evento <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.tipoEvento} onValueChange={handleTipoEventoChange}>
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                    <SelectValue placeholder="Selecciona tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEvento.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.text}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroInvitados" className="text-sm font-medium">
                  Número de Invitados <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numeroInvitados"
                  type="number"
                  min="1"
                  value={formData.numeroInvitados}
                  onChange={(e) => setFormData({ ...formData, numeroInvitados: e.target.value })}
                  placeholder="Ej: 150"
                  className="border-blue-200 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Fechas y Horarios</h3>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fechaInicial" className="text-sm font-medium">Fecha Inicial <span className="text-red-500">*</span></Label>
                <Input id="fechaInicial" type="date" value={formData.fechaInicial} onChange={(e) => setFormData({ ...formData, fechaInicial: e.target.value })} className="border-blue-200 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFinal" className="text-sm font-medium">Fecha Final <span className="text-red-500">*</span></Label>
                <Input id="fechaFinal" type="date" value={formData.fechaFinal} onChange={(e) => setFormData({ ...formData, fechaFinal: e.target.value })} className="border-blue-200 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaInicio" className="text-sm font-medium">Hora Inicio <span className="text-red-500">*</span></Label>
                <Input id="horaInicio" type="time" value={formData.horaInicio} onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })} className="border-blue-200 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaFin" className="text-sm font-medium">Hora Fin <span className="text-red-500">*</span></Label>
                <Input id="horaFin" type="time" value={formData.horaFin} onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })} className="border-blue-200 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
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
                  onFocus={() => { if (filteredClientes.length > 0) setShowClienteDropdown(true) }}
                  placeholder="Escribe para buscar cliente..."
                  className="border-blue-200 focus:ring-blue-500"
                  autoComplete="off"
                />
                {showClienteDropdown && filteredClientes.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-blue-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClientes.map((cliente) => (
                      <button key={cliente.value} type="button" onClick={() => handleClienteSelect(cliente)} className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-blue-100 last:border-b-0">
                        <span className="text-sm text-gray-800">{cliente.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="cliente@example.com" className="border-blue-200 focus:ring-blue-500" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input id="telefono" type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="(555) 123-4567" className="border-blue-200 focus:ring-blue-500" />
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Sección de paquete — siempre visible en edición */}
      <Card className="shadow-lg mt-4 border border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 text-lg font-semibold">Asignación de Paquete</CardTitle>
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
          <CardDescription>
            {!formData.tipoEvento
              ? "Selecciona un Tipo de Evento para poder agregar un paquete."
              : "Haz clic en Agregar Paquete para seleccionar el paquete de esta cotización."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {elementosPaquete.length > 0 && (
            <div className="bg-[#f7f5f0] rounded-xl p-8">
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

              {(() => {
                const tipoIconMap: Record<string, React.ReactElement> = {
                  lugar: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path d="M3 21V7a2 2 0 012-2h3M21 21V7a2 2 0 00-2-2h-3M8 21V5a2 2 0 012-2h4a2 2 0 012 2v16" strokeLinecap="round" strokeLinejoin="round"/></svg>),
                  alimentos: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 0v4m-4 2h8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3"/></svg>),
                  platillos: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path d="M3 12h18M3 12a9 9 0 0118 0M12 3v1m0 16v1M5 19l.5-.5M18.5 5.5l.5-.5M5 5l.5.5M18.5 18.5l.5.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
                  bebidas: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path d="M8 2l1 8H6L5 2h3zm11 0l-1 8h3l1-8h-3zM5 10h14l-1.5 10H6.5L5 10z" strokeLinecap="round" strokeLinejoin="round"/></svg>),
                  mobiliario: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><rect x="3" y="10" width="18" height="4" rx="1"/><path d="M5 14v4m14-4v4M3 10V8a2 2 0 012-2h14a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
                  servicio: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/></svg>),
                  cortesias: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><rect x="3" y="8" width="18" height="14" rx="1"/><path d="M12 8V4m0 0C12 4 9 2 7 4m5 0c0 0 3-2 5 0" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="8" x2="12" y2="22"/><line x1="3" y1="13" x2="21" y2="13"/></svg>),
                  beneficios: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
                }

                const grouped: Record<string, any[]> = {}
                for (const el of elementosPaquete) {
                  const key = (el.tipoelemento || el.tipo || "otros").toLowerCase()
                  if (!grouped[key]) grouped[key] = []
                  grouped[key].push(el)
                }

                const grupos = Object.entries(grouped)
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
                            <p className={`text-sm ${item.destacado ? "text-[#b87333]" : "text-gray-600"}`}>
                              {item.descripcion || item.nombre || item.elemento || ""}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleEliminarElemento(item.tipoelemento, item.elementoid)}
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
                          onClick={() => handleAbrirAgregar(tipo)}
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
          )}

          {loadingElementos && (
            <p className="text-sm text-gray-500 text-center py-6">Cargando paquete...</p>
          )}

          {!loadingElementos && elementosPaquete.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Aún no se ha asignado ningún paquete.</p>
          )}
        </CardContent>
      </Card>

      {/* Modal Agregar Paquete */}
      {showPaqueteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Seleccionar Paquete</h2>
              <button type="button" onClick={() => setShowPaqueteModal(false)} className="text-gray-400 hover:text-gray-600">
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
                  <SelectTrigger><SelectValue placeholder="Selecciona un paquete" /></SelectTrigger>
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
            {selectedPaqueteInfo && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-1">
                <p className="text-sm font-semibold text-gray-800">{selectedPaqueteInfo.nombre || selectedPaqueteInfo.name}</p>
                {selectedPaqueteInfo.descripcion && <p className="text-xs text-gray-500">{selectedPaqueteInfo.descripcion}</p>}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPaqueteModal(false)}>Cancelar</Button>
              <Button type="button" disabled={!selectedPaqueteId || assigningPaquete} onClick={handleConfirmPaquete} className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white">
                {assigningPaquete ? "Asignando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Elemento */}
      {showAgregarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">Agregar elemento — {agregarTipo}</h2>
              <button type="button" onClick={() => setShowAgregarModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium capitalize">{agregarTipo}</Label>
              {loadingTabla ? (
                <p className="text-sm text-gray-500">Cargando elementos...</p>
              ) : elementosTabla.length === 0 ? (
                <p className="text-sm text-gray-400">No se encontraron elementos disponibles.</p>
              ) : (
                <Select value={selectedElementoId} onValueChange={setSelectedElementoId}>
                  <SelectTrigger><SelectValue placeholder={`Selecciona un elemento de ${agregarTipo}`} /></SelectTrigger>
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
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAgregarModal(false)}>Cancelar</Button>
              <Button type="button" disabled={!selectedElementoId || savingElemento} onClick={handleAgregarElemento} className="bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white">
                {savingElemento ? "Guardando..." : "Agregar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
