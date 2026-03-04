import { MenuCategoryForm } from "@/components/admin/menus/menu-category-form"

export default function EditMenuCategoryPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Categoría de Menú</h1>
        <p className="text-muted-foreground mt-1">Modifica la información de la categoría</p>
      </div>

      <MenuCategoryForm categoryId={params.id} />
    </div>
  )
}
