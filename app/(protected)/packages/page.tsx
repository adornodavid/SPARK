import { obtenerPaquetes } from "@/app/actions/paquetes"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { PaquetesGrid } from "@/components/admin/packages/paquetes-grid"

export default async function PackagesPage() {
  const [paquetesResult, hotelesResult] = await Promise.all([
    obtenerPaquetes(),
    listaDesplegableHoteles(),
  ])

  const paquetes = paquetesResult.data || []
  const hoteles = hotelesResult.data || []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PaquetesGrid paquetesInicial={paquetes} hoteles={hoteles} />
    </div>
  )
}
