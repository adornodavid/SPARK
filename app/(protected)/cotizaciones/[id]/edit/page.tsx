"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { QuotationEditor } from "@/components/admin/quotations/quotation-editor"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function EditQuotationPage({ params }: { params: { id: string } }) {
  const [quotation, setQuotation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadQuotation()
  }, [])

  async function loadQuotation() {
    const { data, error } = await supabase
      .from("banquet_quotations")
      .select(`
        *,
        client:clients(name, email),
        hotel:hotels(name),
        event_space:event_spaces(name)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error loading quotation:", error)
    } else {
      setQuotation(data)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  if (!quotation) {
    return <div className="p-6">Cotización no encontrada</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Cotización {quotation.folio}</h1>
          <Badge>{quotation.status}</Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          {quotation.client?.name} - {quotation.event_type} -{" "}
          {new Date(quotation.event_date).toLocaleDateString("es-MX")}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Hotel:</span>
              <p className="font-medium">{quotation.hotel?.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Salón:</span>
              <p className="font-medium">{quotation.event_space?.name || "No asignado"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Personas:</span>
              <p className="font-medium">{quotation.number_of_people}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuotationEditor quotationId={params.id} quotation={quotation} onUpdate={loadQuotation} />
    </div>
  )
}
