"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { obtenerElementosCotizacion } from "@/app/actions/catalogos"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileDown, Mail } from "lucide-react"

export default function ResumenCotizacionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const cotizacionId = searchParams.get("id")
  const supabase = createClient()

  const [cotizacion, setCotizacion] = useState<any>(null)
  const [elementos, setElementos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cotizacionId) return
    async function cargarDatos() {
      setLoading(true)
      const { data, error } = await supabase
        .from("vw_ocotizaciones")
        .select("*")
        .eq("id", Number(cotizacionId))
        .single()

      if (!error && data) setCotizacion(data)

      const elementosResult = await obtenerElementosCotizacion(Number(cotizacionId))
      if (elementosResult.success && elementosResult.data) {
        setElementos(elementosResult.data)
      }
      setLoading(false)
    }
    cargarDatos()
  }, [cotizacionId])

  // Agrupar elementos por tipoelemento
  const grouped: Record<string, any[]> = {}
  for (const el of elementos) {
    const key = el.tipoelemento || "Otros"
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(el)
  }

  function handleExportPdf() {
    window.print()
  }

  function handleEnviarCliente() {
    alert("Funcionalidad de envío por correo próximamente.")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500 text-sm">Cargando resumen...</p>
      </div>
    )
  }

  if (!cotizacion) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500 text-sm">No se encontró la cotización.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resumen de Cotización</h1>
            <p className="text-sm text-gray-500">Folio: {cotizacion.folio}</p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize text-sm px-3 py-1">
          {cotizacion.estatus}
        </Badge>
      </div>

      {/* Información del Evento */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Información del Evento</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Nombre del Evento</p>
            <p className="text-sm font-medium text-gray-900">{cotizacion.nombreevento || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tipo de Evento</p>
            <p className="text-sm font-medium text-gray-900">{cotizacion.tipoevento || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Hotel</p>
            <p className="text-sm font-medium text-gray-900">{cotizacion.hotel || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Cliente</p>
            <p className="text-sm font-medium text-gray-900">{cotizacion.cliente || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha Inicio</p>
            <p className="text-sm font-medium text-gray-900">
              {cotizacion.fechainicio ? new Date(cotizacion.fechainicio).toLocaleDateString("es-MX") : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha Fin</p>
            <p className="text-sm font-medium text-gray-900">
              {cotizacion.fechafin ? new Date(cotizacion.fechafin).toLocaleDateString("es-MX") : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Hora Inicio</p>
            <p className="text-sm font-medium text-gray-900">{cotizacion.horainicio || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Hora Fin</p>
            <p className="text-sm font-medium text-gray-900">{cotizacion.horafin || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">No. de Invitados</p>
            <p className="text-sm font-medium text-gray-900">{cotizacion.numeroinvitados || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-sm font-medium text-gray-900">
              {cotizacion.totalmonto ? `$${Number(cotizacion.totalmonto).toLocaleString("es-MX")}` : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Elementos del Paquete */}
      {Object.keys(grouped).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Elementos del Paquete</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {Object.entries(grouped).map(([tipo, items]) => (
              <div key={tipo}>
                <h3 className="text-xs font-bold tracking-widest text-gray-700 uppercase mb-2">{tipo}</h3>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className={`text-sm ${item.destacado ? "text-[#b87333] font-medium" : "text-gray-600"}`}>
                      {item.descripcion || item.nombre || item.elemento || "-"}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={handleExportPdf}
          className="flex items-center gap-2 min-w-[140px]"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </Button>
        <Button
          type="button"
          onClick={handleEnviarCliente}
          className="flex items-center gap-2 min-w-[160px] bg-[#1a3d2e] hover:bg-[#1a3d2e]/90 text-white"
        >
          <Mail className="w-4 h-4" />
          Enviar a Cliente
        </Button>
      </div>
    </div>
  )
}
