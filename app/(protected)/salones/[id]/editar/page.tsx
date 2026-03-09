import { objetoSalon, obtenerMontajesXSalon } from "@/app/actions/salones"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import { SalonEditForm } from "@/components/admin/salones/salon-edit-form"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function EditarSalonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const salonId = Number(id)

  if (isNaN(salonId) || salonId <= 0) {
    notFound()
  }

  // Fetch salon, montajes, and hoteles in parallel
  const [salonResult, montajesResult, hotelesResult] = await Promise.all([
    objetoSalon(salonId),
    obtenerMontajesXSalon(salonId),
    listaDesplegableHoteles(),
  ])

  if (!salonResult.success || !salonResult.data) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" asChild className="gap-1 px-2">
          <Link href="/salones">
            <ArrowLeft className="h-3.5 w-3.5" />
            Salones
          </Link>
        </Button>
        <span>/</span>
        <Link href={`/salones/${id}`} className="hover:text-foreground transition-colors">
          {salonResult.data.nombre}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Editar</span>
      </div>

      <SalonEditForm
        salon={salonResult.data}
        hoteles={hotelesResult.data || []}
        montajes={montajesResult.data || []}
      />
    </div>
  )
}
