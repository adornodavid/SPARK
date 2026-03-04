"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface QuotationEditorProps {
  quotationId: string
  quotation: any
  onUpdate: () => void
}

export function QuotationEditor({ quotationId, quotation, onUpdate }: QuotationEditorProps) {
  const supabase = createBrowserClient()
  const [items, setItems] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newItem, setNewItem] = useState({
    type: "service",
    description: "",
    quantity: "1",
    unit_price: "",
    discount_percentage: "0",
  })
  const [selectedPackageId, setSelectedPackageId] = useState("")

  useEffect(() => {
    loadItems()
    loadPackages()
  }, [])

  async function loadItems() {
    const { data } = await supabase
      .from("banquet_quotation_items")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("created_at")

    if (data) setItems(data)
    calculateTotal(data || [])
  }

  async function loadPackages() {
    const { data } = await supabase
      .from("banquet_packages")
      .select("*")
      .eq("hotel_id", quotation.hotel_id)
      .eq("is_active", true)
      .order("name")

    if (data) setPackages(data)
  }

  async function handleAddItem() {
    if (!newItem.description || !newItem.unit_price) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    setLoading(true)

    const quantity = Number.parseFloat(newItem.quantity)
    const unitPrice = Number.parseFloat(newItem.unit_price)
    const discountPercentage = Number.parseFloat(newItem.discount_percentage)
    const subtotal = quantity * unitPrice
    const discountAmount = subtotal * (discountPercentage / 100)
    const total = subtotal - discountAmount

    const { error } = await supabase.from("banquet_quotation_items").insert({
      quotation_id: quotationId,
      type: newItem.type,
      description: newItem.description,
      quantity,
      unit_price: unitPrice,
      discount_percentage: discountPercentage,
      subtotal,
      discount_amount: discountAmount,
      total,
    })

    setLoading(false)

    if (error) {
      console.error("Error adding item:", error)
      alert("Error al agregar el ítem")
      return
    }

    setNewItem({
      type: "service",
      description: "",
      quantity: "1",
      unit_price: "",
      discount_percentage: "0",
    })
    loadItems()
  }

  async function handleAddPackage() {
    if (!selectedPackageId) {
      alert("Por favor selecciona un paquete")
      return
    }

    const selectedPackage = packages.find((p) => p.id === selectedPackageId)
    if (!selectedPackage) return

    setLoading(true)

    const quantity = quotation.number_of_people
    const unitPrice = selectedPackage.price_per_person
    const subtotal = quantity * unitPrice
    const total = subtotal

    const { error } = await supabase.from("banquet_quotation_items").insert({
      quotation_id: quotationId,
      package_id: selectedPackageId,
      type: "package",
      description: `Paquete: ${selectedPackage.name}`,
      quantity,
      unit_price: unitPrice,
      discount_percentage: 0,
      subtotal,
      discount_amount: 0,
      total,
    })

    setLoading(false)

    if (error) {
      console.error("Error adding package:", error)
      alert("Error al agregar el paquete")
      return
    }

    setSelectedPackageId("")
    loadItems()
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("¿Estás seguro de eliminar este ítem?")) return

    const { error } = await supabase.from("banquet_quotation_items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting item:", error)
      alert("Error al eliminar el ítem")
    } else {
      loadItems()
    }
  }

  async function calculateTotal(currentItems: any[]) {
    const subtotal = currentItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const totalDiscount = currentItems.reduce((sum, item) => sum + (item.discount_amount || 0), 0)
    const beforeTax = subtotal - totalDiscount
    const tax = beforeTax * 0.16 // IVA 16%
    const total = beforeTax + tax

    await supabase
      .from("banquet_quotations")
      .update({
        subtotal_amount: subtotal,
        discount_amount: totalDiscount,
        tax_amount: tax,
        total_amount: total,
      })
      .eq("id", quotationId)

    onUpdate()
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Ítems de la Cotización</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Add Package Section */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Paquete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un paquete" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - ${pkg.price_per_person}/persona
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddPackage} disabled={loading || !selectedPackageId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Paquete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Custom Item Section */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Servicio/Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={newItem.type} onValueChange={(value) => setNewItem({ ...newItem, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Servicio</SelectItem>
                      <SelectItem value="product">Producto</SelectItem>
                      <SelectItem value="menu">Menú</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Descripción</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Descripción del ítem"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Precio Unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descuento %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.discount_percentage}
                    onChange={(e) => setNewItem({ ...newItem, discount_percentage: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={handleAddItem} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Ítem
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Ítems de la Cotización</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">P. Unitario</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Descuento</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No hay ítems agregados
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="capitalize">{item.type}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unit_price?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${item.subtotal?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {item.discount_percentage > 0 && (
                            <span className="text-destructive">
                              -{item.discount_percentage}% (${item.discount_amount?.toLocaleString()})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">${item.total?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Cotización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>${quotation.subtotal_amount?.toLocaleString() || "0"}</span>
                </div>
                <div className="flex justify-between text-lg text-destructive">
                  <span>Descuento:</span>
                  <span>-${quotation.discount_amount?.toLocaleString() || "0"}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>IVA (16%):</span>
                  <span>${quotation.tax_amount?.toLocaleString() || "0"}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold border-t pt-3">
                  <span>Total:</span>
                  <span>${quotation.total_amount?.toLocaleString() || "0"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
