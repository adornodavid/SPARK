import { QuotationForm } from "@/components/admin/quotations/quotation-form"

export default function NewQuotationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva Cotización de Banquete</h1>
        <p className="text-muted-foreground mt-1">Crea una nueva cotización para un evento o banquete</p>
      </div>

      <QuotationForm />
    </div>
  )
}
