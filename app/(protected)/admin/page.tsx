"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [selectedSalon, setSelectedSalon] = useState<string>("")
  const [fechaInicial, setFechaInicial] = useState<string>("")
  const [fechaFinal, setFechaFinal] = useState<string>("")

  useEffect(() => {
    async function checkSession() {
      const sessionData = await obtenerSesion()

      // Validar que la sesión esté activa
      if (!sessionData || !sessionData.SesionActiva) {
        router.push("/auth/login")
        return
      }

      // Validar que el rolid esté permitido (1,2,3,4)
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

  const upcomingEvents: Array<{ type: string; date: string; title: string; location: string }> = []

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
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
            {/* Hotel Filter */}
            <div className="space-y-2">
              <Label htmlFor="hotel">Hotel</Label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger id="hotel">
                  <SelectValue placeholder="Seleccionar hotel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Sin hoteles disponibles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salon Filter */}
            <div className="space-y-2">
              <Label htmlFor="salon">Salón</Label>
              <Select value={selectedSalon} onValueChange={setSelectedSalon}>
                <SelectTrigger id="salon">
                  <SelectValue placeholder="Seleccionar salón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Sin salones disponibles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Inicial */}
            <div className="space-y-2">
              <Label htmlFor="fecha-inicial">Fecha Inicial</Label>
              <input
                id="fecha-inicial"
                type="date"
                min={todayString}
                value={fechaInicial}
                onChange={(e) => {
                  setFechaInicial(e.target.value)
                  if (fechaFinal && e.target.value > fechaFinal) {
                    setFechaFinal("")
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Fecha Final */}
            <div className="space-y-2">
              <Label htmlFor="fecha-final">Fecha Final</Label>
              <input
                id="fecha-final"
                type="date"
                min={fechaInicial || todayString}
                value={fechaFinal}
                onChange={(e) => setFechaFinal(e.target.value)}
                disabled={!fechaInicial}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl font-bold min-w-[180px] text-center">
                  {monthNames[currentMonth]} {currentYear}
                </CardTitle>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => router.push("/cotizaciones")} className="gap-2">
                <Plus className="h-4 w-4" />
                Generar Cotización
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day names header */}
            <div className="grid grid-cols-7 gap-1 mb-3">
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

                return (
                  <div
                    key={index}
                    className={`
                      relative aspect-square p-2 rounded-lg transition-all duration-200
                      ${day === null ? "bg-transparent" : ""}
                      ${isPast && day !== null ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed" : ""}
                      ${!isPast && day !== null ? "bg-card border border-border hover:border-primary hover:shadow-lg hover:scale-105 cursor-pointer" : ""}
                      ${isTodayDay ? "bg-primary/10 border-2 border-primary shadow-md" : ""}
                    `}
                  >
                    {day && (
                      <div className="flex flex-col h-full">
                        <div
                          className={`
                            text-xs font-bold mb-1
                            ${isTodayDay ? "text-primary" : ""}
                            ${isPast ? "text-muted-foreground/50" : "text-foreground"}
                          `}
                        >
                          {day}
                        </div>
                        {!isPast && (
                          <div className="flex-1 flex flex-col gap-0.5">
                            {/* Event indicators will be added here */}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/10 border-2 border-primary"></div>
                <span className="text-xs text-muted-foreground">Hoy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted/20"></div>
                <span className="text-xs text-muted-foreground">Pasado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-card border border-border"></div>
                <span className="text-xs text-muted-foreground">Disponible</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No hay eventos programados</p>
                  <p className="text-xs text-muted-foreground mt-1">Los próximos eventos aparecerán aquí</p>
                </div>
              ) : (
                upcomingEvents.map((event: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="group-hover:border-primary">
                        {event.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{event.date}</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
