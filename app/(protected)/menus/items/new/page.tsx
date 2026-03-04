import { MenuItemForm } from "@/components/admin/menus/menu-item-form"

export default function NewMenuItemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Platillo</h1>
        <p className="text-muted-foreground mt-1">Agrega un nuevo platillo al menú</p>
      </div>

      <MenuItemForm />
    </div>
  )
}
