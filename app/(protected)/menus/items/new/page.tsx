import { Suspense } from "react"
import { MenuItemForm } from "@/components/admin/menus/menu-item-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function NewMenuItemPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Platillo</h1>
        <p className="text-muted-foreground mt-1">Agrega un nuevo platillo al menu</p>
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
        <MenuItemForm />
      </Suspense>
    </div>
  )
}
