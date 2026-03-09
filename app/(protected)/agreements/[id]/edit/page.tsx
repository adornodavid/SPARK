"use client"

import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AgreementForm } from "@/components/admin/agreements/agreement-form"

export default function EditAgreementPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/agreements/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Convenio</h1>
          <p className="text-muted-foreground mt-1">Modifica la informacion del convenio</p>
        </div>
      </div>

      <AgreementForm agreementId={id} />
    </div>
  )
}
