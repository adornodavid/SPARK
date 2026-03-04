import { PackageForm } from "@/components/admin/packages/package-form"

export default function NewPackagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Paquete</h1>
        <p className="text-muted-foreground mt-1">Crea un nuevo paquete de banquetes</p>
      </div>

      <PackageForm />
    </div>
  )
}
