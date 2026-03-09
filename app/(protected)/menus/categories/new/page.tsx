import { MenuCategoryForm } from "@/components/admin/menus/menu-category-form"

export default function NewMenuCategoryPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Categoria de Menu</h1>
        <p className="text-muted-foreground mt-1">Crea una nueva categoria para organizar los platillos</p>
      </div>

      <MenuCategoryForm />
    </div>
  )
}
