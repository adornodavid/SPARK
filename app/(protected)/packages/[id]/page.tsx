import { obtenerPaquete } from "@/app/actions/paquetes"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { PaqueteDetalle } from "@/components/admin/packages/paquete-detalle"
import { notFound } from "next/navigation"

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const paqueteId = Number(id)

  if (isNaN(paqueteId)) {
    notFound()
  }

  const [paqueteResult, hotelesResult] = await Promise.all([
    obtenerPaquete(paqueteId),
    listaDesplegableHoteles(),
  ])

  if (!paqueteResult.success || !paqueteResult.data) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PaqueteDetalle paquete={paqueteResult.data} hoteles={hotelesResult.data || []} />
    </div>
  )
}
