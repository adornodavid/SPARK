import { MenuCategoryForm } from "@/components/admin/menus/menu-category-form"

export default function NewMenuCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva Categoría de Menú</h1>
        <p className="text-muted-foreground mt-1">Crea una nueva categoría para organizar los platillos</p>
      </div>

      <MenuCategoryForm />
    </div>
  )
}
