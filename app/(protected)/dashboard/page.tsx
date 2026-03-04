"use client"

import { useState, useEffect } from "react"
import { obtenerSesion } from "@/app/actions/session"
import { obtenerCalendarios } from "@/app/actions/calendario"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones } from "@/app/actions/salones"
import type { oCalendario } from "@/types/calendario"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Users,
  BarChart3,
  FileText,
  CheckCircle2,
  DoorClosed,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [eventos, setEventos] = useState<oCalendario[]>([])
  const [selectedEvento, setSelectedEvento] = useState<oCalendario | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [selectedHotel, setSelectedHotel] = useState<string>("all")
  const [selectedSalon, setSelectedSalon] = useState<string>("all")
  const [fechaInicial, setFechaInicial] = useState<string>("")
  const [fechaFinal, setFechaFinal] = useState<string>("")

  const [filters, setFilters] = useState({
    cotizaciones: true,
    reservaciones: true,
    canceladas: false,
    confirmadas: true,
    pendientes: true,
  })

  const [hotelesList, setHotelesList] = useState<{ value: string; text: string }[]>([])
  const [salonesList, setSalonesList] = useState<{ value: string; text: string }[]>([])

  const [showYearView, setShowYearView] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const sessionData = await obtenerSesion()

      if (!sessionData || !sessionData.SesionActiva) {
        router.push("/auth/login")
        return
      }

      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(sessionData.RolId))) {
        router.push("/dashboard")
        return
      }

      setSession(sessionData)
      setLoading(false)
    }

    checkSession()
  }, [router])

  useEffect(() => {
    async function loadEventos() {
      const hotelId = selectedHotel === "all" ? -1 : Number.parseInt(selectedHotel)
      const salonId = selectedSalon === "all" ? -1 : Number.parseInt(selectedSalon)

      const result = await obtenerCalendarios(
        -1, // id
        "", // nombreevento
        hotelId, // hotelid from filter
        salonId, // salonid from filter
        "", // estatus
        "", // tipo
        "1900-01-01", // fecharangoinicio
        "2100-01-01", // fecharangofin
      )
      console.log("result", result)
      if (result.success && Array.isArray(result.data)) {
        setEventos(result.data as oCalendario[])
      }
    }

    if (!loading) {
      loadEventos()
    }
  }, [loading, selectedHotel, selectedSalon]) // Added selectedHotel and selectedSalon as dependencies

  useEffect(() => {
    const fetchDropdowns = async () => {
      const hotelesResult = await listaDesplegableHoteles()
      if (hotelesResult.success && hotelesResult.data) {
        setHotelesList(hotelesResult.data)
      }

      const salonesResult = await listaDesplegableSalones()
      if (salonesResult.success && salonesResult.data) {
        setSalonesList(salonesResult.data)
      }
    }

    fetchDropdowns()
  }, [])

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const todayString = today.toISOString().split("T")[0]

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const getFilteredEventos = () => {
    return eventos.filter((evento) => {
      // Filter by type
      if (evento.tipo === "Cotizacion" && !filters.cotizaciones) return false
      if (evento.tipo === "Reservacion" && !filters.reservaciones) return false

      // Filter by status
      if (evento.estatus === "cancelada" && !filters.canceladas) return false
      if (
        (evento.estatus === "reservada" || evento.estatus === "confirmada") &&
        evento.tipo === "Reservacion" &&
        !filters.confirmadas
      )
        return false
      if (evento.estatus === "pendiente" && evento.tipo === "Reservacion" && !filters.pendientes) return false

      return true
    })
  }

  const getEventosForDayInMonth = (day: number, month: number, year: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    return getFilteredEventos().filter((evento) => {
      const fechaInicio = evento.fechainicio
      const fechaFin = evento.fechafin
      return dateStr >= fechaInicio && dateStr <= fechaFin
    })
  }

  const getEventosForDay = (day: number) => {
    return getEventosForDayInMonth(day, currentMonth, currentYear)
  }

  const getEventColor = (evento: oCalendario) => {
    // Cancelada - Rojo
    if (evento.estatus === "cancelada") {
      return "bg-[#D16481] text-white"
    }
    // Reservacion Confirmada - Gris/Morado
    if (evento.tipo === "Reservacion" && (evento.estatus === "reservada" || evento.estatus === "confirmada")) {
      return "bg-[#747180] text-white"
    }
    // Reservacion Pendiente - Azul celeste
    if (evento.tipo === "Reservacion" && evento.estatus === "pendiente") {
      return "bg-[#5AB2BF] text-white"
    }
    // Cotizacion - Naranja
    if (evento.tipo === "Cotizacion") {
      return "bg-[#BFBA5A] text-white"
    }

    return "bg-gray-500/80 text-white"
  }

  const upcomingEvents = getFilteredEventos()
    .filter((evento) => {
      const fechaInicio = new Date(evento.fechainicio)
      return fechaInicio >= today
    })
    .sort((a, b) => new Date(a.fechainicio).getTime() - new Date(b.fechainicio).getTime())
    .slice(0, 7)

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const calendarDays = []

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const isPastDay = (day: number | null) => {
    if (day === null) return false
    const dayDate = new Date(currentYear, currentMonth, day)
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dayDate < todayDate
  }

  const isToday = (day: number | null) => {
    if (day === null) return false
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDayClick = (day: number) => {
    if (isPastDay(day)) return

    const eventosDelDia = getEventosForDay(day)
    if (eventosDelDia.length > 0) {
      setSelectedEvento(eventosDelDia[0])
      setModalOpen(true)
    }
  }

  const statistics = {
    totalEventos: eventos.length,
    eventosCotizados: eventos.filter((e) => e.tipo === "Cotizacion").length,
    eventosReservados: eventos.filter((e) => e.tipo === "Reservacion").length,
    topSalones: Object.entries(
      eventos.reduce(
        (acc, evento) => {
          if (evento.salon) {
            acc[evento.salon] = (acc[evento.salon] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      ),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
    topHoteles: Object.entries(
      eventos
        .filter((e) => e.tipo === "Reservacion")
        .reduce(
          (acc, evento) => {
            if (evento.hotel) {
              acc[evento.hotel] = (acc[evento.hotel] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>,
        ),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-[#fffdfb]">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Calendario de reservaciones y cotizaciones</p>
      </div>

      {/* Filters Section */}
      <Card className="gap-3 py-3 rounded-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotel">Hotel</Label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger id="hotel" className="w-full">
                  <SelectValue placeholder="Seleccionar hotel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los hoteles</SelectItem>
                  {hotelesList.map((hotel) => (
                    <SelectItem key={hotel.value} value={hotel.value}>
                      {hotel.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salon">Salón</Label>
              <Select value={selectedSalon} onValueChange={setSelectedSalon}>
                <SelectTrigger id="salon" className="w-full">
                  <SelectValue placeholder="Seleccionar salón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los salones</SelectItem>
                  {salonesList.map((salon) => (
                    <SelectItem key={salon.value} value={salon.value}>
                      {salon.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Label className="text-sm font-semibold mb-3 block">Filtrar por tipo y estatus:</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cotizaciones"
                  checked={filters.cotizaciones}
                  onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, cotizaciones: checked as boolean }))}
                />
                <label
                  htmlFor="cotizaciones"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Cotizaciones
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reservaciones"
                  checked={filters.reservaciones}
                  onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, reservaciones: checked as boolean }))}
                />
                <label
                  htmlFor="reservaciones"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Reservaciones
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmadas"
                  checked={filters.confirmadas}
                  onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, confirmadas: checked as boolean }))}
                />
                <label
                  htmlFor="confirmadas"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Confirmadas
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pendientes"
                  checked={filters.pendientes}
                  onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, pendientes: checked as boolean }))}
                />
                <label
                  htmlFor="pendientes"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Pendientes
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canceladas"
                  checked={filters.canceladas}
                  onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, canceladas: checked as boolean }))}
                />
                <label
                  htmlFor="canceladas"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Canceladas
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-xs lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => setShowYearView(!showYearView)}
                  className="text-xl font-bold min-w-[180px] text-center hover:text-primary transition-colors"
                >
                  {monthNames[currentMonth]} {currentYear}
                </button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => router.push("/cotizarevento")} className="gap-2">
                <Plus className="h-4 w-4" />
                Generar Cotización
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {showYearView ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Vista Anual - {currentYear}</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowYearView(false)}>
                    Volver a Vista Mensual
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {monthNames.map((monthName, monthIndex) => {
                    const daysInThisMonth = getDaysInMonth(monthIndex, currentYear)
                    const firstDayOfThisMonth = getFirstDayOfMonth(monthIndex, currentYear)
                    const calendarDaysForMonth = []

                    for (let i = 0; i < firstDayOfThisMonth; i++) {
                      calendarDaysForMonth.push(null)
                    }

                    for (let day = 1; day <= daysInThisMonth; day++) {
                      calendarDaysForMonth.push(day)
                    }

                    return (
                      <div key={monthIndex} className="border rounded-lg p-2">
                        <button
                          onClick={() => {
                            setCurrentMonth(monthIndex)
                            setShowYearView(false)
                          }}
                          className="text-sm font-semibold mb-2 hover:text-primary transition-colors w-full text-center"
                        >
                          {monthName}
                        </button>
                        <div className="grid grid-cols-7 gap-0.5 text-xs">
                          {["D", "L", "M", "M", "J", "V", "S"].map((day, i) => (
                            <div key={i} className="text-center font-medium text-muted-foreground p-0.5">
                              {day}
                            </div>
                          ))}
                          {calendarDaysForMonth.map((day, index) => {
                            if (day === null) {
                              return <div key={`empty-${index}`} className="aspect-square" />
                            }

                            const dayEventos = getEventosForDayInMonth(day, monthIndex, currentYear)
                            const hasEvents = dayEventos.length > 0
                            const firstEvento = dayEventos[0]

                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  setCurrentMonth(monthIndex)
                                  setShowYearView(false)
                                }}
                                className={`
                                  aspect-square flex items-center justify-center text-[10px] rounded
                                  transition-colors
                                  ${hasEvents ? `${getEventColor(firstEvento)} hover:opacity-80` : "hover:bg-muted"}
                                `}
                              >
                                {day}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const isPast = isPastDay(day)
                    const isTodayDay = isToday(day)
                    const eventosDelDia = day ? getEventosForDay(day) : []
                    const hasEvents = eventosDelDia.length > 0
                    const primaryEvento = eventosDelDia[0]

                    return (
                      <div
                        key={index}
                        onClick={() => day && handleDayClick(day)}
                        className={`
                          relative aspect-square p-2 rounded-lg transition-all duration-200
                          ${day === null ? "bg-transparent" : ""}
                          ${isPast && day !== null ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed" : ""}
                          ${!isPast && day !== null && !hasEvents ? "bg-card border border-border hover:border-primary hover:shadow-lg hover:scale-105 cursor-pointer" : ""}
                          ${!isPast && day !== null && hasEvents ? `cursor-pointer hover:scale-105 hover:shadow-xl ${getEventColor(primaryEvento)}` : ""}
                          ${isTodayDay ? "ring-2 ring-primary ring-offset-2" : ""}
                        `}
                      >
                        {day && (
                          <div className="flex flex-col h-full overflow-hidden">
                            <div
                              className={`
                                text-sm font-bold mb-1 text-center
                                ${isTodayDay && !hasEvents ? "text-primary" : ""}
                                ${isPast ? "text-muted-foreground/50" : ""}
                                ${hasEvents ? "text-white" : "text-foreground"}
                              `}
                            >
                              {day}
                            </div>
                            {!isPast && hasEvents && (
                              <div className="flex-1 flex flex-col gap-1 overflow-hidden text-white">
                                {eventosDelDia.slice(0, 1).map((evento, idx) => (
                                  <div key={idx} className="flex flex-col gap-0.5 text-[0.6rem] leading-tight">
                                    <div className="font-bold truncate" title={evento.nombreevento}>
                                      {evento.nombreevento}
                                    </div>
                                    <div className="truncate opacity-90" title={evento.hotel}>
                                      🏨 {evento.hotel}
                                    </div>
                                    <div className="truncate opacity-90" title={evento.salon}>
                                      🚪 {evento.salon}
                                    </div>
                                    <div className="text-[0.65rem] font-bold truncate bg-white/30 px-1.5 py-1 rounded-md mt-0.5 text-center uppercase tracking-wide">
                                      {evento.estatus}
                                    </div>
                                    {evento.tipo === "Reservacion" && evento.estatus === "confirmada" && (
                                      <div className="text-[0.6rem] font-bold text-center bg-green-500 text-white px-1 py-0.5 rounded mt-0.5 animate-pulse">
                                        ✓ CONFIRMADO
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {eventosDelDia.length > 1 && (
                                  <div className="text-[0.55rem] text-center font-semibold bg-white/30 rounded px-1 py-0.5">
                                    +{eventosDelDia.length - 1} más
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded ring-2 ring-primary ring-offset-2"></div>
                    <span className="text-xs text-muted-foreground">Hoy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500"></div>
                    <span className="text-xs text-muted-foreground">Cotización</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500"></div>
                    <span className="text-xs text-muted-foreground">Confirmada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500"></div>
                    <span className="text-xs text-muted-foreground">Pendiente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500"></div>
                    <span className="text-xs text-muted-foreground">Cancelada</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xs">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] overflow-y-auto">
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No hay eventos programados</p>
                    <p className="text-xs text-muted-foreground mt-1">Los próximos eventos aparecerán aquí</p>
                  </div>
                ) : (
                  upcomingEvents.slice(0, 7).map((evento, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedEvento(evento)
                        setModalOpen(true)
                      }}
                      className="p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-base">{evento.nombreevento}</h3>
                        <Badge
                          variant="outline"
                          className={`
                            ${
                              evento.tipo === "Cotizacion"
                                ? "border-orange-500 text-orange-700"
                                : evento.estatus === "Cancelada"
                                  ? "border-red-500 text-red-700"
                                  : evento.estatus === "Pendiente"
                                    ? "border-cyan-500 text-cyan-700"
                                    : "border-purple-500 text-purple-700"
                            }
                          `}
                        >
                          {evento.estatus}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(evento.fechainicio).toLocaleDateString("es-MX", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {evento.hotel} - {evento.salon}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-blue-50 to-blue-100/50">
                    <div className="flex flex-col items-center">
                      <Calendar className="h-3.5 w-3.5 text-blue-600 mb-0.5" />
                      <p className="text-[10px] font-medium text-blue-900 text-center">Total</p>
                      <span className="text-lg font-bold text-blue-700">{statistics.totalEventos}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-orange-50 to-orange-100/50">
                    <div className="flex flex-col items-center">
                      <FileText className="h-3.5 w-3.5 text-orange-600 mb-0.5" />
                      <p className="text-[10px] font-medium text-orange-900 text-center">Cotizados</p>
                      <span className="text-lg font-bold text-orange-700">{statistics.eventosCotizados}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-purple-50 to-purple-100/50">
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 mb-0.5" />
                      <p className="text-[10px] font-medium text-purple-900 text-center">Reservados</p>
                      <span className="text-lg font-bold text-purple-700">{statistics.eventosReservados}</span>
                    </div>
                  </div>
                </div>

                {/* Top 3 Salones */}
                <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-teal-50 to-teal-100/50">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <DoorClosed className="h-3.5 w-3.5 text-teal-600" />
                    <h3 className="text-[10px] font-bold text-teal-900">Top 3 Salones</h3>
                  </div>
                  <div className="space-y-1">
                    {statistics.topSalones.length > 0 ? (
                      statistics.topSalones.map(([salon, count], index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-1.5 py-1 bg-white/60 rounded text-[10px]"
                        >
                          <p className="truncate flex-1" title={salon}>
                            {salon}
                          </p>
                          <span className="font-bold text-teal-700 ml-1">{count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-center text-muted-foreground py-1">No hay datos</p>
                    )}
                  </div>
                </div>

                {/* Top 3 Hoteles */}
                <div className="p-2 rounded-lg border border-border bg-gradient-to-br from-green-50 to-green-100/50">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Building2 className="h-3.5 w-3.5 text-green-600" />
                    <h3 className="text-[10px] font-bold text-green-900">Top 3 Hoteles</h3>
                  </div>
                  <div className="space-y-1">
                    {statistics.topHoteles.length > 0 ? (
                      statistics.topHoteles.map(([hotel, count], index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-1.5 py-1 bg-white/60 rounded text-[10px]"
                        >
                          <p className="truncate flex-1" title={hotel}>
                            {hotel}
                          </p>
                          <span className="font-bold text-green-700 ml-1">{count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-center text-muted-foreground py-1">No hay datos</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-[#FFFAF5]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Detalles del Evento
            </DialogTitle>
          </DialogHeader>
          {selectedEvento && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-primary">{selectedEvento.nombreevento}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Folio: {selectedEvento.folio}</p>
                </div>
                <Badge
                  className={`
                    ${
                      selectedEvento.tipo === "Cotizacion"
                        ? "bg-orange-500/20 text-orange-700 border-orange-500"
                        : selectedEvento.estatus === "Cancelada"
                          ? "bg-red-500/20 text-red-700 border-red-500"
                          : selectedEvento.estatus === "Pendiente"
                            ? "bg-cyan-500/20 text-cyan-700 border-cyan-500"
                            : "bg-purple-500/20 text-purple-700 border-purple-500"
                    }
                  `}
                >
                  {selectedEvento.tipo} - {selectedEvento.estatus}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Ubicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Hotel</p>
                      <p className="font-semibold">{selectedEvento.hotel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Salón</p>
                      <p className="font-semibold">{selectedEvento.salon}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Montaje</p>
                      <p className="font-semibold">{selectedEvento.montaje}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Fecha y Hora
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha Inicio</p>
                      <p className="font-semibold">
                        {new Date(selectedEvento.fechainicio).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha Fin</p>
                      <p className="font-semibold">{new Date(selectedEvento.fechafin).toLocaleDateString("es-MX")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horario</p>
                      <p className="font-semibold">
                        {selectedEvento.horainicio} - {selectedEvento.horafin}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Información Adicional
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente Asignado</p>
                    <p className="font-semibold">{selectedEvento.cliente}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Número de Invitados</p>
                    <p className="font-semibold">{selectedEvento.numeroinvitados}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cotizado Por</p>
                    <p className="font-semibold">{selectedEvento.cotizadopor || "N/A"}</p>
                  </div>
                  {selectedEvento.notas && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Notas</p>
                      <p className="font-semibold text-sm">{selectedEvento.notas}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => router.push(`/${selectedEvento.tipo.toLowerCase()}s`)}>
                  Ver Detalles Completos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
