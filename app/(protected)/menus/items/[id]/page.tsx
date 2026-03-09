"use client"

import { Suspense } from "react"
import { use } from "react"
import { MenuItemForm } from "@/components/admin/menus/menu-item-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Editar Platillo</h1>
        <p className="text-muted-foreground mt-1">Modifica la informacion del platillo</p>
      </div>

      <Suspense
        fallback={
          <div className="spark-card p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        }
      >
        <MenuItemForm itemId={resolvedParams.id} />
      </Suspense>
    </div>
  )
}
