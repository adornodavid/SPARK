"use client"

import { use } from "react"
import { MenuCategoryForm } from "@/components/admin/menus/menu-category-form"

export default function EditMenuCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Editar Categoria de Menu</h1>
        <p className="text-muted-foreground mt-1">Modifica la informacion de la categoria</p>
      </div>

      <MenuCategoryForm categoryId={resolvedParams.id} />
    </div>
  )
}
