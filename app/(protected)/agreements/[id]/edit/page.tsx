import { AgreementForm } from "@/components/admin/agreements/agreement-form"

export default function EditAgreementPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Convenio Corporativo</h1>
        <p className="text-muted-foreground mt-1">Modifica la información del convenio</p>
      </div>

      <AgreementForm agreementId={params.id} />
    </div>
  )
}
