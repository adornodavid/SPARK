"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Plus, Search, Filter, Package, Users, Hotel, DollarSign, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { oPaquete } from "@/types/paquetes"
import { TIPOS_PAQUETE, TIPO_PAQUETE_CONFIG } from "@/types/paquetes"
import type { ddlItem } from "@/types/common"

interface PaquetesGridProps {
  paquetesInicial: oPaquete[]
  hoteles: ddlItem[]
}

const formatMXN = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr))
}

export function PaquetesGrid({ paquetesInicial, hoteles }: PaquetesGridProps) {
  const [busqueda, setBusqueda] = useState("")
  const [hotelFiltro, setHotelFiltro] = useState("all")
  const [tipoFiltro, setTipoFiltro] = useState("all")
  const [activoFiltro, setActivoFiltro] = useState("all")

  const paquetesFiltrados = useMemo(() => {
    return paquetesInicial.filter((p) => {
      // Busqueda por nombre
      if (busqueda.trim() !== "") {
        const term = busqueda.toLowerCase()
        if (!p.nombre.toLowerCase().includes(term) && !(p.descripcion || "").toLowerCase().includes(term)) {
          return false
        }
      }
      // Filtro por hotel
      if (hotelFiltro !== "all" && p.hotelid.toString() !== hotelFiltro) {
        return false
      }
      // Filtro por tipo
      if (tipoFiltro !== "all" && p.tipo !== tipoFiltro) {
        return false
      }
      // Filtro por activo
      if (activoFiltro === "activo" && !p.activo) return false
      if (activoFiltro === "inactivo" && p.activo) return false

      return true
    })
  }, [paquetesInicial, busqueda, hotelFiltro, tipoFiltro, activoFiltro])

  // Agrupar por hotel
  const paquetesPorHotel = useMemo(() => {
    const grouped: Record<string, { hotel: string; paquetes: oPaquete[] }> = {}
    for (const p of paquetesFiltrados) {
      const key = p.hotelid.toString()
      if (!grouped[key]) {
        grouped[key] = { hotel: p.hotel || "Sin hotel", paquetes: [] }
      }
      grouped[key].paquetes.push(p)
    }
    return Object.values(grouped)
  }, [paquetesFiltrados])

  const isVigente = (p: oPaquete) => {
    const hoy = new Date().toISOString().split("T")[0]
    if (p.vigenciainicio && p.vigenciainicio > hoy) return false
    if (p.vigenciafin && p.vigenciafin < hoy) return false
    return true
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paquetes de Banquetes</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los paquetes de eventos y banquetes de todos los hoteles
          </p>
        </div>
        <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
          <Link href="/packages/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paquete
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Busqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar paquete..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Hotel */}
          <Select value={hotelFiltro} onValueChange={setHotelFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los hoteles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los hoteles</SelectItem>
              {hoteles.map((h) => (
                <SelectItem key={h.value} value={h.value}>
                  {h.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tipo */}
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {TIPOS_PAQUETE.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Estado */}
          <Select value={activoFiltro} onValueChange={setActivoFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="inactivo">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resultados */}
      <div className="text-sm text-muted-foreground">
        {paquetesFiltrados.length} paquete{paquetesFiltrados.length !== 1 ? "s" : ""} encontrado{paquetesFiltrados.length !== 1 ? "s" : ""}
      </div>

      {/* Grid de paquetes agrupados por hotel */}
      {paquetesFiltrados.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No hay paquetes</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {busqueda || hotelFiltro !== "all" || tipoFiltro !== "all"
              ? "No se encontraron paquetes con los filtros seleccionados"
              : "Comienza creando tu primer paquete de banquetes"}
          </p>
          {!busqueda && hotelFiltro === "all" && tipoFiltro === "all" && (
            <Button asChild className="mt-4 bg-foreground text-background hover:bg-foreground/90">
              <Link href="/packages/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear Paquete
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {paquetesPorHotel.map((grupo) => (
            <div key={grupo.hotel}>
              {/* Hotel header (solo si hay multiples hoteles) */}
              {paquetesPorHotel.length > 1 && (
                <div className="flex items-center gap-2 mb-4">
                  <Hotel className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{grupo.hotel}</h2>
                  <Badge variant="outline" className="text-xs">
                    {grupo.paquetes.length}
                  </Badge>
                </div>
              )}

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grupo.paquetes.map((paquete) => {
                  const tipoConfig = TIPO_PAQUETE_CONFIG[paquete.tipo] || TIPO_PAQUETE_CONFIG["Otro"]
                  const vigente = isVigente(paquete)

                  return (
                    <Link
                      key={paquete.id}
                      href={`/packages/${paquete.id}`}
                      className="spark-card block p-5 hover:border-border transition-all"
                    >
                      {/* Header: nombre + badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-base leading-tight line-clamp-2">
                          {paquete.nombre}
                        </h3>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-xs border ${tipoConfig.bgColor} ${tipoConfig.color}`}
                          >
                            {tipoConfig.label}
                          </Badge>
                          {!paquete.activo && (
                            <Badge variant="outline" className="text-xs border-red-300 bg-red-100 text-red-700">
                              Inactivo
                            </Badge>
                          )}
                          {paquete.activo && !vigente && (
                            <Badge variant="outline" className="text-xs border-amber-300 bg-amber-100 text-amber-700">
                              No vigente
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Descripcion */}
                      {paquete.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {paquete.descripcion}
                        </p>
                      )}

                      {/* Hotel (si no esta agrupado) */}
                      {paquetesPorHotel.length <= 1 && paquete.hotel && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <Hotel className="h-3 w-3" />
                          <span>{paquete.hotel}</span>
                        </div>
                      )}

                      {/* Precios */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {paquete.preciobase > 0 && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Precio base</p>
                              <p className="text-sm font-semibold">{formatMXN(paquete.preciobase)}</p>
                            </div>
                          </div>
                        )}
                        {paquete.precioporpersona > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Por persona</p>
                              <p className="text-sm font-semibold">{formatMXN(paquete.precioporpersona)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Capacidad y vigencia */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>
                            {paquete.minimopersonas}
                            {paquete.maximopersonas ? ` - ${paquete.maximopersonas}` : "+"} personas
                          </span>
                        </div>
                        {(paquete.vigenciainicio || paquete.vigenciafin) && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(paquete.vigenciainicio) || "..."}
                              {" - "}
                              {formatDate(paquete.vigenciafin) || "..."}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Items incluidos (preview) */}
                      {paquete.incluye && paquete.incluye.length > 0 && (
                        <div className="mt-3 border-t border-border/50 pt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Incluye ({paquete.incluye.length} items):
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {paquete.incluye.slice(0, 3).join(", ")}
                            {paquete.incluye.length > 3 && ` y ${paquete.incluye.length - 3} mas...`}
                          </p>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
