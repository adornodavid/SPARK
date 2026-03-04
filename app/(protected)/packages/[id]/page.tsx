import { PackageForm } from "@/components/admin/packages/package-form"

export default function EditPackagePage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Paquete</h1>
        <p className="text-muted-foreground mt-1">Modifica la información del paquete</p>
      </div>

      <PackageForm packageId={params.id} />
    </div>
  )
}
