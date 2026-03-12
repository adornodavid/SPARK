"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { obtenerSesion } from "@/app/actions/session"
import { useRouter, useSearchParams } from "next/navigation"
import CalendarFilterPanel from "@/components/admin/calendar/calendar-filter-panel"
import CalendarGrid from "@/components/admin/calendar/calendar-grid"
import CalendarSidebar from "@/components/admin/calendar/calendar-sidebar"
import DayDetailSheet from "@/components/admin/calendar/day-detail-sheet"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Initialize filters from URL params
  const [selectedHotel, setSelectedHotel] = useState<string>(
    searchParams.get("hotelId") || "all",
  )
  const [selectedSalon, setSelectedSalon] = useState<string>(
    searchParams.get("salonId") || "all",
  )

  const [filters, setFilters] = useState({
    cotizaciones: true,
    reservaciones: true,
    canceladas: false,
    confirmadas: true,
    pendientes: true,
  })

  // Day Detail Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Session check
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

  // Persist filter state in URL params (sin remontar componente)
  const updateUrlParams = useCallback(
    (hotelId: string, salonId: string) => {
      const params = new URLSearchParams()
      if (hotelId !== "all") params.set("hotelId", hotelId)
      if (salonId !== "all") params.set("salonId", salonId)
      const queryString = params.toString()
      const newUrl = queryString ? `/dashboard?${queryString}` : "/dashboard"
      window.history.replaceState(null, "", newUrl)
    },
    [],
  )

  const handleHotelChange = (value: string) => {
    setSelectedHotel(value)
    setSelectedSalon("all")
    updateUrlParams(value, "all")
  }

  const handleSalonChange = (value: string) => {
    setSelectedSalon(value)
    updateUrlParams(selectedHotel, value)
  }

  // Open day detail sheet
  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setSheetOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6 bg-background">
        {/* Title skeleton */}
        <div>
          <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-80 rounded bg-muted animate-pulse mt-2" />
        </div>

        {/* Filter panel skeleton */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="h-9 w-48 rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-48 rounded-md bg-muted animate-pulse" />
            <div className="h-9 flex-1 rounded-md bg-muted animate-pulse" />
          </div>
        </div>

        {/* Calendar + Sidebar skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid skeleton */}
          <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-32 rounded bg-muted animate-pulse" />
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                <div className="h-8 w-8 rounded bg-muted animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`head-${i}`} className="h-6 rounded bg-muted animate-pulse" />
              ))}
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={`cell-${i}`} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <div className="h-6 w-40 rounded bg-muted animate-pulse" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`event-${i}`} className="rounded-lg border border-border/50 p-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-background">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Calendario multipropiedad de reservaciones y cotizaciones
        </p>
      </div>

      {/* Filter Panel */}
      <CalendarFilterPanel
        selectedHotel={selectedHotel}
        selectedSalon={selectedSalon}
        onHotelChange={handleHotelChange}
        onSalonChange={handleSalonChange}
        filters={filters}
        onFiltersChange={setFilters}
        userHoteles={session?.Hoteles || ""}
      />

      {/* Calendar Grid + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CalendarGrid
          selectedHotel={selectedHotel}
          selectedSalon={selectedSalon}
          filters={filters}
          onDayClick={handleDayClick}
        />

        <CalendarSidebar
          selectedHotel={selectedHotel}
          selectedSalon={selectedSalon}
          onEventClick={handleDayClick}
        />
      </div>

      {/* Day Detail Sheet */}
      <DayDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedDate={selectedDate}
        selectedHotel={selectedHotel}
        selectedSalon={selectedSalon}
      />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 bg-background">
          <div>
            <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-80 rounded bg-muted animate-pulse mt-2" />
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="h-9 w-48 rounded-md bg-muted animate-pulse" />
              <div className="h-9 w-48 rounded-md bg-muted animate-pulse" />
              <div className="h-9 flex-1 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-6">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <div className="h-6 w-40 rounded bg-muted animate-pulse" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
