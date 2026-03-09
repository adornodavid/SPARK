"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Search, X, MapPin, Building2, Star, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  listaDesplegablePaisesXHoteles,
  listDesplegableEstadosXHoteles,
  listaDesplegableCiudadesXHoteles,
} from "@/app/actions/catalogos"
import { listaDesplegableHoteles, obtenerHoteles } from "@/app/actions/hoteles"
import type { ddlItem } from "@/types/common"

export default function CotizarEventoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [hotel, setHotel] = useState("")
  const [nombreHotel, setNombreHotel] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [estatus, setEstatus] = useState("Todos")
  const [pais, setPais] = useState("")
  const [estado, setEstado] = useState("")
  const [activoEvento, setActivoEvento] = useState("Todos")
  const [activoCentroConsumo, setActivoCentroConsumo] = useState("Todos")

  const [hotelesList, setHotelesList] = useState<ddlItem[]>([])
  const [paisesList, setPaisesList] = useState<ddlItem[]>([])
  const [estadosList, setEstadosList] = useState<ddlItem[]>([])
  const [ciudadesList, setCiudadesList] = useState<ddlItem[]>([])

  const [hotelesData, setHotelesData] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    async function loadHoteles() {
      const result = await listaDesplegableHoteles()
      if (result.success && result.data) {
        setHotelesList(result.data)
      }
    }
    loadHoteles()
  }, [])

  useEffect(() => {
    async function loadPaises() {
      const result = await listaDesplegablePaisesXHoteles()
      if (result.success && result.data) {
        setPaisesList(result.data)
      }
    }
    loadPaises()
  }, [])

  useEffect(() => {
    async function loadEstados() {
      if (pais && pais !== "") {
        const result = await listDesplegableEstadosXHoteles(-1, "", Number(pais))
        if (result.success && result.data) {
          setEstadosList(result.data)
        }
      } else {
        setEstadosList([])
        setEstado("")
      }
    }
    loadEstados()
  }, [pais])

  useEffect(() => {
    async function loadCiudades() {
      if (estado && estado !== "") {
        const result = await listaDesplegableCiudadesXHoteles(-1, "", Number(estado))
        if (result.success && result.data) {
          setCiudadesList(result.data)
        }
      } else {
        setCiudadesList([])
        setCiudad("")
      }
    }
    loadCiudades()
  }, [estado, pais])

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

  useEffect(() => {
    async function loadInitialHoteles() {
      setSearching(true)
      try {
        const result = await obtenerHoteles()

        if (result.success && result.data) {
          const sortedData = Array.isArray(result.data) ? [...result.data].sort((a, b) => (a.hotelid ?? 0) - (b.hotelid ?? 0)) : []
          setHotelesData(sortedData)
        } else {
          setHotelesData([])
        }
      } catch {
        setHotelesData([])
      } finally {
        setSearching(false)
      }
    }

    if (!loading) {
      loadInitialHoteles()
    }
  }, [loading])

  const handleSearch = async () => {
    setSearching(true)
    try {
      const result = await obtenerHoteles(
        hotel ? Number(hotel) : -1,
        "",
        nombreHotel,
        pais ? Number(pais) : -1,
        estado ? Number(estado) : -1,
        ciudad ? Number(ciudad) : -1,
        activoEvento,
        activoCentroConsumo,
        estatus,
      )

      if (result.success && result.data) {
        const sortedData = Array.isArray(result.data) ? [...result.data].sort((a, b) => (a.hotelid ?? 0) - (b.hotelid ?? 0)) : []
        setHotelesData(sortedData)
      } else {
        setHotelesData([])
      }
    } catch {
      setHotelesData([])
    } finally {
      setSearching(false)
    }
  }

  const handleClear = () => {
    setHotel("")
    setNombreHotel("")
    setCiudad("")
    setEstatus("Todos")
    setPais("")
    setEstado("")
    setActivoEvento("Todos")
    setActivoCentroConsumo("Todos")
    setHotelesData([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cotizar Evento</h1>
          <p className="text-sm text-muted-foreground mt-1">Seleccione un hotel para cotizar su evento</p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Filtros de Búsqueda</h2>

            <div className="grid grid-cols-[16rem_16rem_13rem_10rem] gap-3 mb-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-hotel">Nombre Hotel</Label>
                <Input
                  id="nombre-hotel"
                  placeholder="Buscar por hotel..."
                  value={nombreHotel}
                  onChange={(e) => setNombreHotel(e.target.value)}
                  className="w-64"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel</Label>
                <Select value={hotel} onValueChange={setHotel}>
                  <SelectTrigger id="hotel" className="w-64">
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
                <Label htmlFor="ciudad">Ciudad</Label>
                <Select value={ciudad} onValueChange={setCiudad}>
                  <SelectTrigger id="ciudad" className="w-52">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos</SelectItem>
                    {ciudadesList.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estatus">Estatus</Label>
                <Select value={estatus} onValueChange={setEstatus}>
                  <SelectTrigger id="estatus" className="w-40">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              Avanzada
            </button>

            {showAdvanced && (
              <>
                <div className="grid grid-cols-[12rem_12rem_11rem_14rem] gap-3 mb-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <Select value={pais} onValueChange={setPais}>
                      <SelectTrigger id="pais" className="w-48">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">Todos</SelectItem>
                        {paisesList.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={estado} onValueChange={setEstado} disabled={!pais}>
                      <SelectTrigger id="estado" className="w-48">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">Todos</SelectItem>
                        {estadosList.map((e) => (
                          <SelectItem key={e.value} value={e.value}>
                            {e.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activo-evento">Activo Evento</Label>
                    <Select value={activoEvento} onValueChange={setActivoEvento}>
                      <SelectTrigger id="activo-evento" className="w-44">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="True">Sí</SelectItem>
                        <SelectItem value="False">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activo-centro-consumo">Activo Centro Consumo</Label>
                    <Select value={activoCentroConsumo} onValueChange={setActivoCentroConsumo}>
                      <SelectTrigger id="activo-centro-consumo" className="w-56">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="True">Sí</SelectItem>
                        <SelectItem value="False">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotelesData.length > 0 ? (
            hotelesData.map((hotel) => (
              <Card
                key={hotel.hotelid}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/landing?hotelId=${hotel.hotelid}`)}
              >
                <div className="relative h-64 bg-muted">
                  <img
                    src={hotel.imgurl || "/placeholder.svg?height=200&width=400&query=hotel"}
                    alt={hotel.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>

                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-primary text-base leading-tight">{hotel.nombre}</h3>

                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">{hotel.direccion}</p>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Habitaciones:</span>
                      <span className="text-foreground">{hotel.totalcuartos || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Capacidad máxima Auditorio:</span>
                      <span className="text-foreground">{hotel.capacidadmaxauditorio || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Espacio total:</span>
                      <span className="text-foreground">{hotel.espaciototal || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Estrellas:</span>
                      <span className="text-foreground">{hotel.estrellas || "N/A"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {searching ? "Buscando hoteles..." : "No hay resultados. Use los filtros y haga clic en Buscar."}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
