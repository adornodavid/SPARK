"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"

interface MenuCategoryFormProps {
  categoryId?: string
}

export function MenuCategoryForm({ categoryId }: MenuCategoryFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    if (categoryId) {
      loadCategory()
    }
  }, [categoryId])

  async function loadCategory() {
    const { data, error } = await supabase.from("menu_categories").select("*").eq("id", categoryId).single()

    if (error) {
      console.error("Error loading category:", error)
      return
    }

    if (data) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = categoryId
      ? await supabase.from("menu_categories").update(formData).eq("id", categoryId)
      : await supabase.from("menu_categories").insert(formData)

    setLoading(false)

    if (error) {
      console.error("Error saving category:", error)
      alert("Error al guardar la categoría")
      return
    }

    router.push("/admin/menus")
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Entradas, Platos Fuertes, Postres..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : categoryId ? "Actualizar" : "Crear"} Categoría
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
