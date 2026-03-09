"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AgreementsTable } from "@/components/admin/agreements/agreements-table"
import { AgreementsFilter } from "@/components/admin/agreements/agreements-filter"
import { obtenerConvenios } from "@/app/actions/convenios"
import type { oConvenio } from "@/types/convenios"
import { toast } from "sonner"

export default function AgreementsPage() {
  const [convenios, setConvenios] = useState<oConvenio[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    estado: "",
    hotelid: -1,
    busqueda: "",
  })

  const loadConvenios = useCallback(async () => {
    setLoading(true)
    const result = await obtenerConvenios({
      hotelid: filters.hotelid,
      estado: filters.estado,
      busqueda: filters.busqueda,
    })

    if (result.success && result.data) {
      setConvenios(result.data)
    } else {
      toast.error(result.error || "Error al cargar convenios")
      setConvenios([])
    }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    loadConvenios()
  }, [loadConvenios])

  // Contar por estado
  const conteoActivos = convenios.filter((c) => c.estado === "activo").length
  const conteoVencidos = convenios.filter((c) => c.estado === "vencido").length
  const conteoTotal = convenios.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Convenios Corporativos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los convenios con empresas y clientes corporativos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadConvenios} title="Actualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Link href="/agreements/new">
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Convenio
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Convenios</p>
          <p className="text-2xl font-bold">{conteoTotal}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="text-2xl font-bold text-emerald-600">{conteoActivos}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-sm text-muted-foreground">Vencidos</p>
          <p className="text-2xl font-bold text-red-600">{conteoVencidos}</p>
        </div>
      </div>

      {/* Filtros */}
      <AgreementsFilter filters={filters} onFiltersChange={setFilters} />

      {/* Tabla */}
      <AgreementsTable convenios={convenios} loading={loading} onUpdate={loadConvenios} />
    </div>
  )
}
