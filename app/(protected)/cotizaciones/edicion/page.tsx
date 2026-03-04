"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { objetoCotizacion } from "@/app/actions/cotizaciones"
import { obtenerElementosCotizacion } from "@/app/actions/catalogos"
import { QuotationEditForm } from "@/components/admin/quotations/quotation-edit-form"

function EdicionContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const eventoid = searchParams.get("eventoid")

  const [cotizacion, setCotizacion] = useState<any>(null)
  const [elementos, setElementos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const result = await objetoCotizacion(Number(id))
    if (result.success && result.data) {
      setCotizacion(result.data)
      const elementosResult = await obtenerElementosCotizacion(Number(id))
      if (elementosResult.success && elementosResult.data) {
        setElementos(elementosResult.data)
      }
    }
    setLoading(false)
  }

  if (!id) {
    return <div className="p-6 text-muted-foreground">No se proporcionó un ID de cotización.</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  if (!cotizacion) {
    return <div className="p-6 text-muted-foreground">Cotización no encontrada.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Cotización</h1>
        <p className="text-muted-foreground mt-1">
          Folio: <span className="font-medium text-foreground">{cotizacion.folio}</span>
        </p>
      </div>
      <QuotationEditForm cotizacion={cotizacion} elementosIniciales={elementos} cotizacionId={Number(id)} />
    </div>
  )
}

export default function EdicionCotizacionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    }>
      <EdicionContent />
    </Suspense>
  )
}
