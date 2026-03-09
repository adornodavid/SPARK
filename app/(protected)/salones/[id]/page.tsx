import { objetoSalon, obtenerMontajesXSalon } from "@/app/actions/salones"
import { SalonDetail } from "@/components/admin/salones/salon-detail"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function SalonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const salonId = Number(id)

  if (isNaN(salonId) || salonId <= 0) {
    notFound()
  }

  // Fetch salon and montajes in parallel
  const [salonResult, montajesResult] = await Promise.all([
    objetoSalon(salonId),
    obtenerMontajesXSalon(salonId),
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
        <span className="text-foreground font-medium">{salonResult.data.nombre}</span>
      </div>

      <SalonDetail
        salon={salonResult.data}
        montajes={montajesResult.data || []}
      />
    </div>
  )
}
