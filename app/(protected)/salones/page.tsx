"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, Building2, Users, Ruler, DollarSign, Edit, Ban, Plus } from "lucide-react"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { listaDesplegableSalones, obtenerSalones } from "@/app/actions/salones"
import type { ddlItem } from "@/types/common"
import Link from "next/link"

export default function SalonesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Filtros
  const [nombre, setNombre] = useState("")
  const [hotel, setHotel] = useState("")
  const [salon, setSalon] = useState("")
  const [capacidad, setCapacidad] = useState("")

  // Listas para dropdowns
  const [hotelesList, setHotelesList] = useState<ddlItem[]>([])
  const [salonesList, setSalonesList] = useState<ddlItem[]>([])

  // Data
  const [salonesData, setSalonesData] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // Rango de capacidad: 20 a 800, incrementos de 20
  const capacidadOptions: number[] = []
  for (let i = 20; i <= 800; i += 20) {
    capacidadOptions.push(i)
  }

  // Session check
  useEffect(() => {
    async function checkSession() {
      const session = await obtenerSesion()
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }
      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(session.RolId))) {
        router.push("/dashboard")
        return
      }
      setLoading(false)
    }
    checkSession()
  }, [router])

  // Cargar hoteles para dropdown
  useEffect(() => {
    async function loadHoteles() {
      const result = await listaDesplegableHoteles()
      if (result.success && result.data) {
        setHotelesList(result.data)
      }
    }
    loadHoteles()
  }, [])

  // Cargar salones filtrados por hotel seleccionado (o todos si Hotel es "Todos")
  useEffect(() => {
    async function loadSalones() {
      const hotelId = hotel && hotel !== "" && hotel !== "-1" ? Number(hotel) : -1
      const result = await listaDesplegableSalones(-1, "", hotelId)
      if (result.success && result.data) {
        setSalonesList(result.data)
      } else {
        setSalonesList([])
      }
      setSalon("")
    }
    loadSalones()
  }, [hotel])

  // Carga inicial de salones
  useEffect(() => {
    if (!loading) {
      handleSearch()
    }
  }, [loading])

  const handleSearch = async () => {
    setSearching(true)
    try {
      const salonId = salon && salon !== "-1" ? Number(salon) : -1
      const hotelId = hotel && hotel !== "-1" ? Number(hotel) : -1
      const cap = capacidad && capacidad !== "-1" ? Number(capacidad) : -1

      const result = await obtenerSalones(salonId, nombre, hotelId, "Todos", cap)

      if (result.success && result.data) {
        setSalonesData(Array.isArray(result.data) ? result.data : [])
      } else {
        setSalonesData([])
      }
    } catch (error) {
      console.error("Error en búsqueda de salones:", error)
      setSalonesData([])
    } finally {
      setSearching(false)
    }
  }

  const handleClear = async () => {
    setNombre("")
    setHotel("")
    setSalon("")
    setCapacidad("")
    setSearching(true)
    try {
      const result = await obtenerSalones(-1, "", -1, "Todos", -1)
      if (result.success && result.data) {
        setSalonesData(Array.isArray(result.data) ? result.data : [])
      }
    } finally {
      setSearching(false)
    }
  }

  // Obtener la primera imagen del JSON fotos
  const getImageUrl = (fotos: any): string => {
    if (!fotos) return "/placeholder.svg?height=200&width=400&query=salon+eventos"
    try {
      if (typeof fotos === "string") {
        const parsed = JSON.parse(fotos)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
      }
      if (Array.isArray(fotos) && fotos.length > 0) return fotos[0]
    } catch {
      // ignore
    }
    return "/placeholder.svg?height=200&width=400&query=salon+eventos"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFAF5] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Salones de Eventos</h1>
            <p className="text-sm text-gray-600 mt-1">Gestiona los salones de eventos de todos los hoteles</p>
          </div>
          <Button asChild>
            <Link href="/salones/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Salón
            </Link>
          </Button>
        </div>

        {/* Filtros de Búsqueda */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Filtros de Búsqueda</h2>

            <div className="grid grid-cols-[1fr_16rem_16rem_10rem] gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-salon">Nombre</Label>
                <Input
                  id="nombre-salon"
                  placeholder="Buscar por nombre..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotel-filter">Hotel</Label>
                <Select value={hotel} onValueChange={setHotel}>
                  <SelectTrigger id="hotel-filter" className="w-64">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos</SelectItem>
                    {hotelesList.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salon-filter">Salón</Label>
                <Select value={salon} onValueChange={setSalon}>
                  <SelectTrigger id="salon-filter" className="w-64">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos</SelectItem>
                    {salonesList.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacidad-filter">Capacidad</Label>
                <Select value={capacidad} onValueChange={setCapacidad}>
                  <SelectTrigger id="capacidad-filter" className="w-40">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todas</SelectItem>
                    {capacidadOptions.map((cap) => (
                      <SelectItem key={cap} value={cap.toString()}>
                        {cap} personas
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" className="gap-2 bg-transparent" onClick={handleClear}>
                <X className="h-4 w-4" />
                Limpiar
              </Button>
              <Button className="gap-2" onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4" />
                {searching ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salonesData.length > 0 ? (
            salonesData.map((s) => (
              <Card key={s.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-64 bg-gray-200">
                  <img
                    src={getImageUrl(s.fotos)}
                    alt={s.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>

                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-blue-600 text-base leading-tight">{s.nombre}</h3>

                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">{s.hotel || "Sin hotel asignado"}</p>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Capacidad:</span>
                      <span className="text-gray-700">
                        {s.capacidadminima || 0} - {s.capacidadmaxima || 0} personas
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Área:</span>
                      <span className="text-gray-700">{s.aream2 || "N/A"} m²</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Dimensiones:</span>
                      <span className="text-gray-700">
                        {s.longitud || 0} x {s.ancho || 0} x {s.altura || 0} m
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Precio/día:</span>
                      <span className="text-gray-700">
                        {s.preciopordia ? `$${Number(s.preciopordia).toLocaleString()}` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {s.descripcion && (
                    <p className="text-xs text-gray-500 line-clamp-2">{s.descripcion}</p>
                  )}

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="hover:bg-blue-50 hover:text-blue-600 bg-transparent"
                        title="Editar salón"
                        onClick={() => router.push(`/salones/${s.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="hover:bg-red-50 hover:text-red-600 bg-transparent"
                        title="Inactivar salón"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              {searching ? "Buscando salones..." : "No hay resultados. Use los filtros y haga clic en Buscar."}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
