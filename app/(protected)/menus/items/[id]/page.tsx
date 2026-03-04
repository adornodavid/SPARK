import { MenuItemForm } from "@/components/admin/menus/menu-item-form"

export default function EditMenuItemPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Platillo</h1>
        <p className="text-muted-foreground mt-1">Modifica la información del platillo</p>
      </div>

      <MenuItemForm itemId={params.id} />
    </div>
  )
}
