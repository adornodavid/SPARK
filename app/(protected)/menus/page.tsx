"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MenuCategoriesTable } from "@/components/admin/menus/menu-categories-table"
import { MenuItemsTable } from "@/components/admin/menus/menu-items-table"

export default function MenusPage() {
  const [categories, setCategories] = useState<any[]>([
    { id: 1, name: "Entradas", description: "Ensaladas y aperitivos", display_order: 1 },
    { id: 2, name: "Sopas y Cremas", description: "Sopas calientes", display_order: 2 },
    { id: 3, name: "Plato Fuerte Ave", description: "Platillos con pollo", display_order: 3 },
    { id: 4, name: "Plato Fuerte Res", description: "Platillos con carne de res", display_order: 4 },
    { id: 5, name: "Postres", description: "Postres y dulces", display_order: 5 },
    { id: 6, name: "Menú Infantil", description: "Platillos para niños", display_order: 6 },
    { id: 7, name: "Canapés", description: "Bocadillos y canapés", display_order: 7 },
    { id: 8, name: "Menú Trasnochador", description: "Comida para el final del evento", display_order: 8 }
  ])
  const [items, setItems] = useState<any[]>([
    { id: 1, name: "Ensalada Berri", description: "Frutos rojos con queso de cabra y vinagreta de cítricos", price: 0, category_id: 1, category: { name: "Entradas" } },
    { id: 2, name: "Ensalada Amanecer", description: "Betabel confitado, lechuga, espinaca, nueces y queso fresco", price: 0, category_id: 1, category: { name: "Entradas" } },
    { id: 3, name: "Ensalada Capri", description: "Espinaca, fresas, pollo, queso fresco de cabra y nuez garapiñada", price: 0, category_id: 1, category: { name: "Entradas" } },
    { id: 4, name: "Ensalada César", description: "Hojas de lechuga con queso parmesano y crotones", price: 0, category_id: 1, category: { name: "Entradas" } },
    
    { id: 5, name: "Crema de tomates asados", description: "Crema de tomates asados", price: 0, category_id: 2, category: { name: "Sopas y Cremas" } },
    { id: 6, name: "Crema de espinacas", description: "Crema de espinacas con almendras tostadas", price: 0, category_id: 2, category: { name: "Sopas y Cremas" } },
    { id: 7, name: "Crema de queso", description: "Crema de queso con lluvia de pimientos asados", price: 0, category_id: 2, category: { name: "Sopas y Cremas" } },
    { id: 8, name: "Crema de elote", description: "Crema de elote", price: 0, category_id: 2, category: { name: "Sopas y Cremas" } },
    { id: 9, name: "Crema de brócoli", description: "Crema de brócoli", price: 0, category_id: 2, category: { name: "Sopas y Cremas" } },
    
    { id: 10, name: "Pollo en escalopas", description: "Pollo en escalopas relleno de queso crema y bañadas en salsa de demi-glace", price: 0, category_id: 3, category: { name: "Plato Fuerte Ave" } },
    { id: 11, name: "Suprema de ave rellena", description: "Suprema de ave rellena de queso crema en salsa de chiles dulces", price: 0, category_id: 3, category: { name: "Plato Fuerte Ave" } },
    { id: 12, name: "Medallón de ave", description: "Medallón de ave en salsa de cilantro", price: 0, category_id: 3, category: { name: "Plato Fuerte Ave" } },
    { id: 13, name: "Pechuga Cordon Bleu", description: "Pechuga Cordon Bleu en espejo de salsa napolitana", price: 0, category_id: 3, category: { name: "Plato Fuerte Ave" } },
    
    { id: 14, name: "Escalopas de res", description: "Escalopas de res en crema de portobello y brandy", price: 0, category_id: 4, category: { name: "Plato Fuerte Res" } },
    { id: 15, name: "Filete de res relleno", description: "Filete de res relleno de queso Roquefort en salsa de chipotle seco y miel", price: 0, category_id: 4, category: { name: "Plato Fuerte Res" } },
    { id: 16, name: "Filete de res con champiñones", description: "Filete de res con champiñones confitados y salsa de vino", price: 0, category_id: 4, category: { name: "Plato Fuerte Res" } },
    { id: 17, name: "Mignon de res", description: "Mignon de res en dos salsas: queso Roquefort y champiñones", price: 0, category_id: 4, category: { name: "Plato Fuerte Res" } },
    { id: 18, name: "Filete de res al vino tinto", description: "Filete de res al vino tinto en salsa bordelesa", price: 0, category_id: 4, category: { name: "Plato Fuerte Res" } },
    
    { id: 19, name: "Crepas rellena de fruta", description: "Crepas rellena de fruta con cajeta y nuez", price: 0, category_id: 5, category: { name: "Postres" } },
    { id: 20, name: "Brownie de chocolate", description: "Brownie de chocolate con helado de vainilla", price: 0, category_id: 5, category: { name: "Postres" } },
    { id: 21, name: "Mil hojas", description: "Mil hojas", price: 0, category_id: 5, category: { name: "Postres" } },
    { id: 22, name: "Tentación de chocolate", description: "Tentación de chocolate", price: 0, category_id: 5, category: { name: "Postres" } },
    { id: 23, name: "Red Velvet", description: "Red Velvet", price: 0, category_id: 5, category: { name: "Postres" } },
    { id: 24, name: "Buñuelo de manzana", description: "Buñuelo de manzana con helado", price: 0, category_id: 5, category: { name: "Postres" } },
    
    { id: 25, name: "Nuggets de pollo", description: "Nuggets de pollo con papas a la francesa y arroz con leche", price: 335, category_id: 6, category: { name: "Menú Infantil" } },
    { id: 26, name: "Tiras de pollo", description: "Tiras de pollo con papas a la francesa y nieve", price: 335, category_id: 6, category: { name: "Menú Infantil" } },
    { id: 27, name: "Hamburguesitas", description: "Hamburguesitas con papas a la francesa y gelatina", price: 335, category_id: 6, category: { name: "Menú Infantil" } },
    { id: 28, name: "Mini hotdogs", description: "Mini hotdogs con papas a la francesa y flan", price: 335, category_id: 6, category: { name: "Menú Infantil" } },
    
    { id: 29, name: "Mini tostada de atún", description: "Mini tostada de atún", price: 0, category_id: 7, category: { name: "Canapés" } },
    { id: 30, name: "Brocheta caprese", description: "Brocheta de ensalada caprese", price: 0, category_id: 7, category: { name: "Canapés" } },
    { id: 31, name: "Tlacoyitos de frijol", description: "Tlacoyitos de frijol negro y carne seca", price: 0, category_id: 7, category: { name: "Canapés" } },
    { id: 32, name: "Taquitos de camarón", description: "Taquitos de camarón al chipotle", price: 0, category_id: 7, category: { name: "Canapés" } },
    
    { id: 33, name: "Tacos de canasta", description: "Tacos de canasta mixtos (4 piezas) con verdura, limón y salsa", price: 155, category_id: 8, category: { name: "Menú Trasnochador" } },
    { id: 34, name: "Gorditas de chicharrón", description: "Gorditas de chicharrón (3 piezas) con verdura, limón y salsa", price: 175, category_id: 8, category: { name: "Menú Trasnochador" } },
    { id: 35, name: "Tacos de pastor o bistec", description: "Tacos de pastor o bistec (4 piezas) con verdura, limón y salsa", price: 305, category_id: 8, category: { name: "Menú Trasnochador" } },
    { id: 36, name: "Menudo", description: "Menudo con verdura y limón", price: 285, category_id: 8, category: { name: "Menú Trasnochador" } },
    { id: 37, name: "Pozole verde o rojo", description: "Pozole verde o rojo (cerdo o pollo) con verdura, limón, lechuga y rábano", price: 285, category_id: 8, category: { name: "Menú Trasnochador" } },
    { id: 38, name: "Chilaquiles con pollo", description: "Chilaquiles con pollo en salsa roja o verde con verdura, crema y queso", price: 335, category_id: 8, category: { name: "Menú Trasnochador" } }
  ])
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [categoriesRes, itemsRes] = await Promise.all([
      supabase.from("menu_categories").select("*").order("name"),
      supabase.from("menu_items").select("*, category:menu_categories(name)").order("name"),
    ])

    if (categoriesRes.data) setCategories(categoriesRes.data)
    if (itemsRes.data) setItems(itemsRes.data)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menús y Platillos</h1>
          <p className="text-muted-foreground mt-1">Gestiona las categorías y platillos para eventos</p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="items">Platillos</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Link href="/admin/menus/categories/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </Link>
          </div>
          <MenuCategoriesTable categories={categories} loading={loading} onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-end">
            <Link href="/admin/menus/items/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Platillo
              </Button>
            </Link>
          </div>
          <MenuItemsTable items={items} loading={loading} onUpdate={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
