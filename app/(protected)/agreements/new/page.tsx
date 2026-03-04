import { AgreementForm } from "@/components/admin/agreements/agreement-form"

export default function NewAgreementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Convenio Corporativo</h1>
        <p className="text-muted-foreground mt-1">Crea un nuevo convenio con descuentos especiales</p>
      </div>

      <AgreementForm />
    </div>
  )
}
