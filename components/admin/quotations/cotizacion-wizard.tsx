"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Hotel, DoorOpen, CalendarDays, UserSearch, Sparkles, Receipt, ClipboardCheck,
  ChevronRight, ChevronLeft, CheckCircle2, XCircle, AlertTriangle,
  Users, Clock, MapPin, Loader2,
} from "lucide-react"

import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones, objetoSalon, objetoSalones } from "@/app/actions/salones"
import { listaDesplegableClientes, objetoCliente, crearCliente } from "@/app/actions/clientes"
import { verificarDisponibilidad, crearCotizacionCompleta, TIPOS_EVENTO } from "@/app/actions/cotizaciones"

import type { ddlItem } from "@/types/common"
import type { oSalon, oMontajeXSalon } from "@/types/salones"

/* ==================================================
  Tipos
================================================== */
interface StepConfig {
  number: number
  title: string
  icon: React.ReactNode
}

const STEPS: StepConfig[] = [
  { number: 1, title: "Hotel y Salon", icon: <Hotel className="h-4 w-4" /> },
  { number: 2, title: "Fecha y Disponibilidad", icon: <CalendarDays className="h-4 w-4" /> },
  { number: 3, title: "Cliente", icon: <UserSearch className="h-4 w-4" /> },
  { number: 4, title: "Evento", icon: <Sparkles className="h-4 w-4" /> },
  { number: 5, title: "Precios", icon: <Receipt className="h-4 w-4" /> },
  { number: 6, title: "Resumen", icon: <ClipboardCheck className="h-4 w-4" /> },
]

/* ==================================================
  Componente Principal
================================================== */
export function CotizacionWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1: Hotel y Salon
  const [hoteles, setHoteles] = useState<ddlItem[]>([])
  const [salones, setSalones] = useState<ddlItem[]>([])
  const [salonCatalog, setSalonCatalog] = useState<oSalon[]>([])
  const [salonDetalle, setSalonDetalle] = useState<oSalon | null>(null)
  const [montajes, setMontajes] = useState<oMontajeXSalon[]>([])
  const [selectedHotel, setSelectedHotel] = useState("")
  const [selectedSalon, setSelectedSalon] = useState("")
  const [selectedHotelName, setSelectedHotelName] = useState("")
  const [selectedSalonName, setSelectedSalonName] = useState("")

  // Step 2: Fecha y Disponibilidad
  const [fechaEvento, setFechaEvento] = useState("")
  const [disponibilidad, setDisponibilidad] = useState<{ checked: boolean; disponible: boolean; conflictos: any[] }>({
    checked: false, disponible: false, conflictos: [],
  })
  const [checkingDisponibilidad, setCheckingDisponibilidad] = useState(false)

  // Step 3: Cliente
  const [clientes, setClientes] = useState<ddlItem[]>([])
  const [filteredClientes, setFilteredClientes] = useState<ddlItem[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState("")
  const [clienteNombre, setClienteNombre] = useState("")
  const [clienteEmail, setClienteEmail] = useState("")
  const [clienteTelefono, setClienteTelefono] = useState("")
  const [isNewCliente, setIsNewCliente] = useState(false)
  const [creatingCliente, setCreatingCliente] = useState(false)

  // Step 4: Evento
  const [nombreEvento, setNombreEvento] = useState("")
  const [tipoEvento, setTipoEvento] = useState("")
  const [pax, setPax] = useState("")
  const [selectedMontaje, setSelectedMontaje] = useState("")
  const [selectedMontajeName, setSelectedMontajeName] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")

  // Step 5: Precios
  const [precioSalon, setPrecioSalon] = useState("")
  const [precioMenuPP, setPrecioMenuPP] = useState("")
  const [extras, setExtras] = useState("")
  const [descuentoPct, setDescuentoPct] = useState("")
  const [notas, setNotas] = useState("")

  // Calculos
  const precioMenuTotal = (Number(precioMenuPP) || 0) * (Number(pax) || 0)
  const subtotalBruto = (Number(precioSalon) || 0) + precioMenuTotal + (Number(extras) || 0)
  const descuento = subtotalBruto * ((Number(descuentoPct) || 0) / 100)
  const subtotal = subtotalBruto - descuento
  const iva = subtotal * 0.16
  const total = subtotal + iva

  /* ==================================================
    Carga Inicial
  ================================================== */
  useEffect(() => {
    loadHoteles()
    loadClientes()
  }, [])

  async function loadHoteles() {
    const result = await listaDesplegableHoteles()
    if (result.success && result.data) {
      setHoteles(result.data)
    }
  }

  async function loadClientes() {
    const result = await listaDesplegableClientes()
    if (result.success && result.data) {
      setClientes(result.data)
      setFilteredClientes(result.data)
    }
  }

  /* ==================================================
    Step 1: Hotel & Salon
  ================================================== */
  async function handleHotelChange(hotelId: string) {
    setSelectedHotel(hotelId)
    setSelectedSalon("")
    setSalonDetalle(null)
    setMontajes([])
    setSelectedMontaje("")
    setPrecioSalon("")

    const hotel = hoteles.find((h) => h.value === hotelId)
    setSelectedHotelName(hotel?.text || "")

    // Load salones para este hotel
    const result = await listaDesplegableSalones(-1, "", Number(hotelId))
    if (result.success && result.data) {
      setSalones(result.data)
    }

    // Load salon catalog con detalles
    const catalogResult = await objetoSalones("", Number(hotelId), "Activo")
    if (catalogResult.success && catalogResult.data) {
      setSalonCatalog(catalogResult.data)
    }
  }

  async function handleSalonChange(salonId: string) {
    setSelectedSalon(salonId)
    setSelectedMontaje("")

    const salon = salones.find((s) => s.value === salonId)
    setSelectedSalonName(salon?.text || "")

    // Load detalle del salon con montajes
    const result = await objetoSalon(Number(salonId))
    if (result.success && result.data) {
      setSalonDetalle(result.data)
      if (result.data.montajes) {
        const montajesActivos = result.data.montajes.filter((m) => m.activo)
        setMontajes(montajesActivos)
      }
      // Pre-fill precio salon si existe
      if (result.data.preciopordia) {
        setPrecioSalon(result.data.preciopordia.toString())
      }
    }
  }

  /* ==================================================
    Step 2: Disponibilidad
  ================================================== */
  async function handleCheckDisponibilidad() {
    if (!selectedSalon || !fechaEvento) {
      toast.error("Selecciona salon y fecha primero")
      return
    }

    setCheckingDisponibilidad(true)
    const result = await verificarDisponibilidad(Number(selectedSalon), fechaEvento)
    setCheckingDisponibilidad(false)

    if (result.success) {
      setDisponibilidad({
        checked: true,
        disponible: result.disponible,
        conflictos: result.conflictos,
      })

      if (result.disponible) {
        toast.success("Salon disponible en la fecha seleccionada")
      } else {
        toast.warning(`Se encontraron ${result.conflictos.length} conflicto(s)`)
      }
    } else {
      toast.error(result.error)
    }
  }

  /* ==================================================
    Step 3: Cliente
  ================================================== */
  function handleClienteSearch(value: string) {
    setClienteNombre(value)
    setSelectedClienteId("")
    setIsNewCliente(false)

    if (value.trim() === "") {
      setFilteredClientes(clientes)
      setShowClienteDropdown(false)
      return
    }

    const term = value.toLowerCase()
    const filtered = clientes.filter((c) => c.text.toLowerCase().includes(term))
    setFilteredClientes(filtered)
    setShowClienteDropdown(true)
  }

  async function handleClienteSelect(cliente: ddlItem) {
    setClienteNombre(cliente.text)
    setSelectedClienteId(cliente.value)
    setShowClienteDropdown(false)
    setIsNewCliente(false)

    // Fetch datos del cliente
    const result = await objetoCliente(Number(cliente.value))
    if (result.success && result.data) {
      setClienteEmail(result.data.email || "")
      setClienteTelefono(result.data.telefono || "")
    }
  }

  function handleNewCliente() {
    setIsNewCliente(true)
    setSelectedClienteId("")
    setShowClienteDropdown(false)
  }

  async function handleCrearCliente() {
    if (!clienteNombre || !clienteEmail) {
      toast.error("Nombre y email son requeridos para crear cliente")
      return
    }

    setCreatingCliente(true)

    const formData = new FormData()
    formData.set("nombre", clienteNombre.split(" ")[0] || clienteNombre)
    formData.set("apellidopaterno", clienteNombre.split(" ").slice(1).join(" ") || "")
    formData.set("apellidomaterno", "")
    formData.set("email", clienteEmail)
    formData.set("telefono", clienteTelefono)
    formData.set("celular", "")
    formData.set("direccion", "")
    formData.set("codigopostal", "")
    formData.set("tipo", "Evento")
    formData.set("fuente", "Cotizacion SPARK")
    formData.set("notas", "")

    const result = await crearCliente(formData)
    setCreatingCliente(false)

    if (result.success) {
      setSelectedClienteId(result.data.toString())
      setIsNewCliente(false)
      toast.success("Cliente creado exitosamente")
      // Recargar lista de clientes
      await loadClientes()
    } else {
      toast.error(result.error || "Error al crear cliente")
    }
  }

  /* ==================================================
    Step 6: Crear Cotizacion
  ================================================== */
  async function handleCrearCotizacion() {
    setSaving(true)

    // Si es cliente nuevo y no se ha creado aun
    if (isNewCliente && !selectedClienteId) {
      await handleCrearCliente()
      if (!selectedClienteId) {
        setSaving(false)
        return
      }
    }

    const result = await crearCotizacionCompleta({
      hotelid: Number(selectedHotel),
      salonid: Number(selectedSalon),
      montajeid: Number(selectedMontaje) || 0,
      clienteid: Number(selectedClienteId),
      fechainicio: fechaEvento,
      fechafin: fechaEvento,
      horainicio: horaInicio,
      horafin: horaFin,
      nombreevento: nombreEvento,
      tipoevento: tipoEvento,
      numeroinvitados: Number(pax) || 0,
      preciosalonsiva: Number(precioSalon) || 0,
      preciomenupp: Number(precioMenuPP) || 0,
      menuseleccionado: "",
      extras: Number(extras) || 0,
      descuentoporcentaje: Number(descuentoPct) || 0,
      notas: notas,
      cotizadopor: 0,
    })

    setSaving(false)

    if (result.success && result.data) {
      toast.success(`Cotizacion ${result.data.folio} creada exitosamente`)
      router.push(`/cotizaciones/${result.data.id}`)
    } else {
      toast.error(result.error || "Error al crear cotizacion")
    }
  }

  /* ==================================================
    Navegacion de Steps
  ================================================== */
  function canAdvance(): boolean {
    switch (currentStep) {
      case 1:
        return !!selectedHotel && !!selectedSalon
      case 2:
        return !!fechaEvento
      case 3:
        return (!!selectedClienteId || (isNewCliente && !!clienteNombre && !!clienteEmail))
      case 4:
        return !!nombreEvento && !!tipoEvento && Number(pax) > 0 && !!horaInicio && !!horaFin
      case 5:
        return true
      default:
        return true
    }
  }

  function goNext() {
    if (canAdvance() && currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  function goBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  /* ==================================================
    Formateo de moneda
  ================================================== */
  function fmtMoney(n: number): string {
    return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 })
  }

  /* ==================================================
    Render de Steps
  ================================================== */
  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between bg-card rounded-xl border p-4 overflow-x-auto">
        {STEPS.map((step, idx) => (
          <div key={step.number} className="flex items-center">
            <button
              onClick={() => {
                if (step.number < currentStep) setCurrentStep(step.number)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm whitespace-nowrap ${
                currentStep === step.number
                  ? "bg-foreground text-background font-semibold shadow-md"
                  : currentStep > step.number
                    ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                    : "bg-muted text-muted-foreground/70"
              }`}
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                currentStep === step.number
                  ? "bg-background text-foreground"
                  : currentStep > step.number
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
              }`}>
                {currentStep > step.number ? <CheckCircle2 className="h-4 w-4" /> : step.number}
              </span>
              <span className="hidden md:inline">{step.title}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <ChevronRight className={`h-4 w-4 mx-1 flex-shrink-0 ${
                currentStep > step.number ? "text-primary" : "text-muted-foreground/50"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* STEP 1: Hotel y Salon */}
        {currentStep === 1 && (
          <Card className="border-lime-200">
            <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
              <div className="flex items-center gap-2">
                <Hotel className="h-5 w-5 text-lime-600" />
                <CardTitle>Seleccion de Hotel y Salon</CardTitle>
              </div>
              <CardDescription>Elige el hotel y el salon para el evento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold">Hotel <span className="text-red-500">*</span></Label>
                  <Select value={selectedHotel} onValueChange={handleHotelChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hoteles.map((hotel) => (
                        <SelectItem key={hotel.value} value={hotel.value}>{hotel.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Salon <span className="text-red-500">*</span></Label>
                  <Select value={selectedSalon} onValueChange={handleSalonChange} disabled={!selectedHotel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un salon" />
                    </SelectTrigger>
                    <SelectContent>
                      {salones.map((salon) => (
                        <SelectItem key={salon.value} value={salon.value}>{salon.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Salon Details Card */}
              {salonDetalle && (
                <div className="bg-lime-50 border border-lime-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-lime-900 flex items-center gap-2">
                    <DoorOpen className="h-4 w-4" />
                    Detalles del Salon: {salonDetalle.nombre}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Area</span>
                      <p className="font-medium">{salonDetalle.aream2 || "N/A"} m2</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cap. Minima</span>
                      <p className="font-medium">{salonDetalle.capacidadminima || "N/A"} personas</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cap. Maxima</span>
                      <p className="font-medium">{salonDetalle.capacidadmaxima || "N/A"} personas</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Precio / dia</span>
                      <p className="font-medium">{salonDetalle.preciopordia ? fmtMoney(salonDetalle.preciopordia) : "N/A"}</p>
                    </div>
                  </div>
                  {montajes.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm">Montajes disponibles:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {montajes.map((m) => (
                          <Badge key={m.montajeid} variant="outline" className="border-lime-300 text-lime-800">
                            {m.montaje} {m.capacidadmaxima ? `(max ${m.capacidadmaxima})` : ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Fecha y Disponibilidad */}
        {currentStep === 2 && (
          <Card className="border-lime-200">
            <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-lime-600" />
                <CardTitle>Fecha del Evento y Disponibilidad</CardTitle>
              </div>
              <CardDescription>Selecciona la fecha y verifica que el salon este disponible</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold">Fecha del Evento <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={fechaEvento}
                    onChange={(e) => {
                      setFechaEvento(e.target.value)
                      setDisponibilidad({ checked: false, disponible: false, conflictos: [] })
                    }}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleCheckDisponibilidad}
                    disabled={!selectedSalon || !fechaEvento || checkingDisponibilidad}
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    {checkingDisponibilidad ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CalendarDays className="h-4 w-4 mr-2" />
                    )}
                    Verificar Disponibilidad
                  </Button>
                </div>
              </div>

              {/* Resultado de disponibilidad */}
              {disponibilidad.checked && (
                <div className={`rounded-xl p-4 border-2 ${
                  disponibilidad.disponible
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}>
                  <div className="flex items-center gap-3">
                    {disponibilidad.disponible ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                          <h4 className="font-semibold text-green-900">Salon Disponible</h4>
                          <p className="text-green-700 text-sm">
                            {selectedSalonName} esta libre el {new Date(fechaEvento + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div>
                          <h4 className="font-semibold text-red-900">Conflictos Encontrados</h4>
                          <p className="text-red-700 text-sm mb-2">
                            Se encontraron {disponibilidad.conflictos.length} evento(s) en esta fecha:
                          </p>
                          <div className="space-y-1">
                            {disponibilidad.conflictos.map((c, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-red-800">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{c.tipo}: {c.nombre} ({c.estatus}) - {c.horario}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Puedes continuar aunque haya conflictos (los horarios podrian no superponerse), pero se recomienda verificar.
              </p>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Cliente */}
        {currentStep === 3 && (
          <Card className="border-lime-200">
            <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
              <div className="flex items-center gap-2">
                <UserSearch className="h-5 w-5 text-lime-600" />
                <CardTitle>Informacion del Cliente</CardTitle>
              </div>
              <CardDescription>Busca un cliente existente o crea uno nuevo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <Label className="font-semibold">Buscar Cliente <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => handleClienteSearch(e.target.value)}
                    onFocus={() => {
                      if (filteredClientes.length > 0 && clienteNombre.trim() !== "") {
                        setShowClienteDropdown(true)
                      }
                    }}
                    placeholder="Escribe para buscar cliente..."
                    autoComplete="off"
                  />

                  {showClienteDropdown && filteredClientes.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredClientes.slice(0, 10).map((cliente) => (
                        <button
                          key={cliente.value}
                          type="button"
                          onClick={() => handleClienteSelect(cliente)}
                          className="w-full text-left px-4 py-2 hover:bg-lime-50 transition-colors border-b border-border last:border-b-0"
                        >
                          <span className="text-sm text-foreground">{cliente.text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedClienteId && !isNewCliente && (
                  <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-lime-600" />
                      <span className="font-semibold text-lime-900">Cliente seleccionado</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nombre</span>
                        <p className="font-medium">{clienteNombre}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email</span>
                        <p className="font-medium">{clienteEmail || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Telefono</span>
                        <p className="font-medium">{clienteTelefono || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedClienteId && !isNewCliente && (
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-sm text-muted-foreground">o</span>
                    <Separator className="flex-1" />
                  </div>
                )}

                {!selectedClienteId && !isNewCliente && (
                  <Button variant="outline" onClick={handleNewCliente} className="w-full border-dashed border-lime-400 text-lime-700 hover:bg-lime-50">
                    + Crear Nuevo Cliente
                  </Button>
                )}

                {isNewCliente && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-foreground">Nuevo Cliente</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm">Nombre <span className="text-red-500">*</span></Label>
                        <Input
                          value={clienteNombre}
                          onChange={(e) => setClienteNombre(e.target.value)}
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Email <span className="text-red-500">*</span></Label>
                        <Input
                          type="email"
                          value={clienteEmail}
                          onChange={(e) => setClienteEmail(e.target.value)}
                          placeholder="email@ejemplo.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Telefono</Label>
                        <Input
                          value={clienteTelefono}
                          onChange={(e) => setClienteTelefono(e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCrearCliente}
                        disabled={creatingCliente || !clienteNombre || !clienteEmail}
                        className="bg-foreground text-background hover:bg-foreground/90"
                        size="sm"
                      >
                        {creatingCliente ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Crear y Seleccionar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsNewCliente(false)
                          setClienteNombre("")
                          setClienteEmail("")
                          setClienteTelefono("")
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Configuracion del Evento */}
        {currentStep === 4 && (
          <Card className="border-lime-200">
            <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-lime-600" />
                <CardTitle>Configuracion del Evento</CardTitle>
              </div>
              <CardDescription>Define los detalles del evento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold">Nombre del Evento <span className="text-red-500">*</span></Label>
                  <Input
                    value={nombreEvento}
                    onChange={(e) => setNombreEvento(e.target.value)}
                    placeholder="Ej: Boda de Juan y Maria"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Tipo de Evento <span className="text-red-500">*</span></Label>
                  <Select value={tipoEvento} onValueChange={setTipoEvento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_EVENTO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold">Numero de Invitados (PAX) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="1"
                    value={pax}
                    onChange={(e) => setPax(e.target.value)}
                    placeholder="Ej: 150"
                  />
                  {salonDetalle?.capacidadmaxima && Number(pax) > salonDetalle.capacidadmaxima && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Excede capacidad maxima del salon ({salonDetalle.capacidadmaxima})
                    </p>
                  )}
                </div>

                {montajes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Montaje</Label>
                    <Select value={selectedMontaje} onValueChange={(v) => {
                      setSelectedMontaje(v)
                      const m = montajes.find((m) => m.montajeid?.toString() === v)
                      setSelectedMontajeName(m?.montaje || "")
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona montaje" />
                      </SelectTrigger>
                      <SelectContent>
                        {montajes.map((m) => (
                          <SelectItem key={m.montajeid} value={m.montajeid?.toString() || ""}>
                            {m.montaje} {m.capacidadmaxima ? `(max ${m.capacidadmaxima})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hora Inicio <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hora Fin <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Menu y Precios */}
        {currentStep === 5 && (
          <Card className="border-lime-200">
            <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-lime-600" />
                <CardTitle>Precios y Menu</CardTitle>
              </div>
              <CardDescription>Configura los precios del salon, menu y extras</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Precios Base</h3>

                  <div className="space-y-2">
                    <Label>Precio Salon (sin IVA)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={precioSalon}
                        onChange={(e) => setPrecioSalon(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Precio Menu por Persona</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={precioMenuPP}
                        onChange={(e) => setPrecioMenuPP(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                    {Number(pax) > 0 && Number(precioMenuPP) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {pax} personas x {fmtMoney(Number(precioMenuPP))} = {fmtMoney(precioMenuTotal)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Extras / Servicios Adicionales</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={extras}
                        onChange={(e) => setExtras(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descuento (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={descuentoPct}
                      onChange={(e) => setDescuentoPct(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Desglose de Precios */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Desglose</h3>
                  <div className="bg-muted rounded-xl p-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precio Salon</span>
                      <span>{fmtMoney(Number(precioSalon) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Menu ({pax || 0} pax x {fmtMoney(Number(precioMenuPP) || 0)})</span>
                      <span>{fmtMoney(precioMenuTotal)}</span>
                    </div>
                    {Number(extras) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Extras</span>
                        <span>{fmtMoney(Number(extras))}</span>
                      </div>
                    )}
                    {Number(descuentoPct) > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Descuento ({descuentoPct}%)</span>
                        <span>-{fmtMoney(descuento)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{fmtMoney(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA (16%)</span>
                      <span>{fmtMoney(iva)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>TOTAL</span>
                      <span className="text-lime-700">{fmtMoney(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Notas / Observaciones</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas adicionales para la cotizacion..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 6: Resumen y Generacion */}
        {currentStep === 6 && (
          <Card className="border-lime-200">
            <CardHeader className="bg-gradient-to-r from-lime-50 to-transparent">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-lime-600" />
                <CardTitle>Resumen de Cotizacion</CardTitle>
              </div>
              <CardDescription>Verifica toda la informacion antes de generar la cotizacion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Evento */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-lime-600" />
                    Evento
                  </h3>
                  <div className="bg-card border rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre</span>
                      <span className="font-medium">{nombreEvento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <Badge variant="outline" className="border-lime-300">{tipoEvento}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha</span>
                      <span className="font-medium">
                        {fechaEvento ? new Date(fechaEvento + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horario</span>
                      <span className="font-medium">{horaInicio} - {horaFin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invitados</span>
                      <span className="font-medium">{pax} personas</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-lime-600" />
                    Lugar
                  </h3>
                  <div className="bg-card border rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hotel</span>
                      <span className="font-medium">{selectedHotelName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salon</span>
                      <span className="font-medium">{selectedSalonName}</span>
                    </div>
                    {selectedMontajeName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Montaje</span>
                        <span className="font-medium">{selectedMontajeName}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-lime-600" />
                    Cliente
                  </h3>
                  <div className="bg-card border rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre</span>
                      <span className="font-medium">{clienteNombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{clienteEmail || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefono</span>
                      <span className="font-medium">{clienteTelefono || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desglose Final */}
              <div className="bg-lime-50 border-2 border-lime-200 rounded-xl p-6 space-y-3">
                <h3 className="font-semibold text-lime-900 text-lg">Desglose de Precios</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Precio Salon</span>
                    <span>{fmtMoney(Number(precioSalon) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Menu ({pax || 0} pax x {fmtMoney(Number(precioMenuPP) || 0)})</span>
                    <span>{fmtMoney(precioMenuTotal)}</span>
                  </div>
                  {Number(extras) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Extras</span>
                      <span>{fmtMoney(Number(extras))}</span>
                    </div>
                  )}
                  {Number(descuentoPct) > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Descuento ({descuentoPct}%)</span>
                      <span>-{fmtMoney(descuento)}</span>
                    </div>
                  )}
                  <Separator className="bg-lime-300" />
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">{fmtMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA (16%)</span>
                    <span>{fmtMoney(iva)}</span>
                  </div>
                  <Separator className="bg-lime-300" />
                  <div className="flex justify-between text-2xl font-bold text-lime-800">
                    <span>TOTAL</span>
                    <span>{fmtMoney(total)}</span>
                  </div>
                </div>
              </div>

              {notas && (
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold text-foreground text-sm mb-1">Notas</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? () => router.push("/cotizaciones") : goBack}
          className="min-w-[120px]"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? "Cancelar" : "Anterior"}
        </Button>

        <span className="text-sm text-muted-foreground">Paso {currentStep} de 6</span>

        {currentStep < 6 ? (
          <Button
            onClick={goNext}
            disabled={!canAdvance()}
            className="min-w-[120px] bg-foreground text-background hover:bg-foreground/90"
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleCrearCotizacion}
            disabled={saving}
            className="min-w-[180px] bg-foreground text-background hover:bg-foreground/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {saving ? "Generando..." : "Generar Cotizacion"}
          </Button>
        )}
      </div>
    </div>
  )
}
