import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { PaqueteFormNuevo } from "@/components/admin/packages/paquete-form-nuevo"

export default async function NewPackagePage() {
  const hotelesResult = await listaDesplegableHoteles()
  const hoteles = hotelesResult.data || []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PaqueteFormNuevo hoteles={hoteles} />
    </div>
  )
}
