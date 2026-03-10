"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, Building2, Users, DollarSign, Edit, Ban, Plus, BedDouble } from "lucide-react"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import type { ddlItem } from "@/types/common"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function HabitacionesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Filtros
  const [nombre, setNombre] = useState("")
  const [hotel, setHotel] = useState("")
  const [categoria, setCategoria] = useState("")

  // Listas para dropdowns
  const [hotelesList, setHotelesList] = useState<ddlItem[]>([])
  const [categoriasList, setCategoriasList] = useState<string[]>([])

  // Data
  const [habitacionesData, setHabitacionesData] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

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

  // Cargar categorias filtradas por hotel seleccionado
  useEffect(() => {
    async function loadCategorias() {
      setCategoria("")
      if (!hotel || hotel === "" || hotel === "-1") {
        setCategoriasList([])
        return
      }
      const supabase = createClient()
      const { data, error } = await supabase
        .from("habitaciones")
        .select("categoria")
        .eq("hotelid", Number(hotel))
      if (!error && data) {
        const unique = [...new Set(data.map((d: any) => d.categoria).filter(Boolean))]
        setCategoriasList(unique.sort())
      } else {
        setCategoriasList([])
      }
    }
    loadCategorias()
  }, [hotel])

  // Carga inicial
  useEffect(() => {
    if (!loading) {
      handleSearch()
    }
  }, [loading])

  const handleSearch = async () => {
    setSearching(true)
    try {
      const supabase = createClient()
      let query = supabase.from("habitaciones").select("*").order("hotelid").order("nombre")

      if (hotel && hotel !== "-1") {
        query = query.eq("hotelid", Number(hotel))
      }
      if (categoria && categoria !== "-1") {
        query = query.eq("categoria", categoria)
      }
      if (nombre.trim() !== "") {
        query = query.ilike("nombre", `%${nombre.trim()}%`)
      }

      const { data, error } = await query
      if (!error && data) {
        setHabitacionesData(data)
      } else {
        setHabitacionesData([])
      }
    } catch (error) {
      console.error("Error en búsqueda de habitaciones:", error)
      setHabitacionesData([])
    } finally {
      setSearching(false)
    }
  }

  const handleClear = async () => {
    setNombre("")
    setHotel("")
    setCategoria("")
    setSearching(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("habitaciones").select("*").order("hotelid").order("nombre")
      if (!error && data) {
        setHabitacionesData(data)
      }
    } finally {
      setSearching(false)
    }
  }

  // Obtener la primera imagen del JSON imgurl
  const getImageUrl = (imgurl: any): string => {
    if (!imgurl) return "/placeholder.svg?height=200&width=400&query=habitacion+hotel"
    try {
      if (typeof imgurl === "string") {
        const parsed = JSON.parse(imgurl)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
      }
      if (Array.isArray(imgurl) && imgurl.length > 0) return imgurl[0]
    } catch {
      // ignore
    }
    return "/placeholder.svg?height=200&width=400&query=habitacion+hotel"
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Habitaciones</h1>
            <p className="text-sm text-gray-600 mt-1">Gestiona las habitaciones de todos los hoteles</p>
          </div>
          <Button asChild>
            <Link href="/habitaciones/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Habitacion
            </Link>
          </Button>
        </div>

        {/* Filtros de Busqueda */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Filtros de Busqueda</h2>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_16rem_16rem] gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-hab">Nombre</Label>
                <Input
                  id="nombre-hab"
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
                <Label htmlFor="categoria-filter">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria} disabled={!hotel || hotel === "-1"}>
                  <SelectTrigger id="categoria-filter" className="w-64">
                    <SelectValue placeholder={!hotel || hotel === "-1" ? "Seleccione hotel primero" : "Todas"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todas</SelectItem>
                    {categoriasList.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
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
          {habitacionesData.length > 0 ? (
            habitacionesData.map((h) => (
              <Card key={h.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-64 bg-gray-200">
                  <img
                    src={getImageUrl(h.imgurl)}
                    alt={h.nombre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${h.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {h.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  {h.categoria && (
                    <div className="absolute top-2 left-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {h.categoria}
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-blue-600 text-base leading-tight">{h.nombre}</h3>

                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">{hotelesList.find((ht) => ht.value === String(h.hotelid))?.text || "Sin hotel asignado"}</p>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Capacidad:</span>
                      <span className="text-gray-700">{h.capacidad || "N/A"} personas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Tasa base:</span>
                      <span className="text-gray-700">
                        {h.tasabase ? `$${Number(h.tasabase).toLocaleString()}` : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Categoria:</span>
                      <span className="text-gray-700">{h.categoria || "Sin categoria"}</span>
                    </div>
                  </div>

                  {h.descripcion && (
                    <p className="text-xs text-gray-500 line-clamp-2">{h.descripcion}</p>
                  )}

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="hover:bg-blue-50 hover:text-blue-600 bg-transparent"
                        title="Editar habitacion"
                        onClick={() => router.push(`/habitaciones/${h.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="hover:bg-red-50 hover:text-red-600 bg-transparent"
                        title="Inactivar habitacion"
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
              {searching ? "Buscando habitaciones..." : "No hay resultados. Use los filtros y haga clic en Buscar."}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
