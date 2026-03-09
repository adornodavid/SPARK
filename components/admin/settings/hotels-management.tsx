"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Building2,
  Pencil,
  Search,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from "lucide-react"
import { actualizarHotelConfig } from "@/app/actions/configuraciones"
import Link from "next/link"

interface HotelsManagementProps {
  hoteles: any[]
  onRefresh: () => void
}

export function HotelsManagement({ hoteles, onRefresh }: HotelsManagementProps) {
  const [busqueda, setBusqueda] = useState("")
  const [editandoHotel, setEditandoHotel] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    nombre: "",
    acronimo: "",
    telefono: "",
    email: "",
    direccion: "",
    website: "",
    activo: true,
    activoevento: true,
    activocentroconsumo: true,
  })

  const hotelesFiltrados = hoteles.filter((h) => {
    if (!busqueda) return true
    const term = busqueda.toLowerCase()
    return (
      (h.nombre || "").toLowerCase().includes(term) ||
      (h.acronimo || "").toLowerCase().includes(term) ||
      (h.ciudad || "").toLowerCase().includes(term) ||
      (h.estado || "").toLowerCase().includes(term)
    )
  })

  function openEditDialog(hotel: any) {
    setEditForm({
      nombre: hotel.nombre || "",
      acronimo: hotel.acronimo || "",
      telefono: hotel.telefono || "",
      email: hotel.email || "",
      direccion: hotel.direccion || "",
      website: hotel.website || "",
      activo: hotel.activo ?? true,
      activoevento: hotel.activoevento ?? true,
      activocentroconsumo: hotel.activocentroconsumo ?? true,
    })
    setEditandoHotel(hotel)
  }

  async function handleEditarHotel() {
    if (!editandoHotel) return
    setSaving(true)
    try {
      const hid = editandoHotel.hotelid || editandoHotel.id
      const result = await actualizarHotelConfig(hid, editForm)
      if (result.success) {
        toast.success("Hotel actualizado exitosamente")
        setEditandoHotel(null)
        onRefresh()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Error al actualizar hotel")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActivo(hotel: any) {
    const hid = hotel.hotelid || hotel.id
    const nuevoEstado = !(hotel.activo ?? true)
    const result = await actualizarHotelConfig(hid, { activo: nuevoEstado })
    if (result.success) {
      toast.success(`Hotel ${nuevoEstado ? "activado" : "desactivado"}`)
      onRefresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Building2 className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Gestion de Hoteles</h3>
            <p className="text-sm text-muted-foreground">
              {hoteles.length} hoteles registrados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar hotel..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>
          <Link href="/hoteles">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver detalle completo
            </Button>
          </Link>
        </div>
      </div>

      {/* Hotels Table */}
      <Card className="rounded-xl border border-border/50 bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Acr.</TableHead>
                <TableHead className="w-[250px]">Hotel</TableHead>
                <TableHead>Ubicacion</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-center">Eventos</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotelesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No se encontraron hoteles
                  </TableCell>
                </TableRow>
              ) : (
                hotelesFiltrados.map((hotel: any) => {
                  const hid = hotel.hotelid || hotel.id
                  return (
                    <TableRow key={hid}>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {hotel.acronimo || "---"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{hotel.nombre}</p>
                          {hotel.categoria && (
                            <p className="text-xs text-muted-foreground">{hotel.categoria}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>
                            {[hotel.ciudad, hotel.estado].filter(Boolean).join(", ") || hotel.direccion || "Sin ubicacion"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {hotel.telefono && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {hotel.telefono}
                            </div>
                          )}
                          {hotel.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {hotel.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            hotel.activoevento
                              ? "bg-lime-100 text-lime-800 border-lime-300"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {hotel.activoevento ? "Si" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={hotel.activo ?? true}
                          onCheckedChange={() => handleToggleActivo(hotel)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(hotel)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Hotel Dialog */}
      <Dialog open={!!editandoHotel} onOpenChange={(open) => !open && setEditandoHotel(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Hotel</DialogTitle>
            <DialogDescription>
              Modifica la informacion basica del hotel. Para configuraciones avanzadas, usa la
              seccion de Hoteles.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2 col-span-2">
                <Label>Nombre del hotel</Label>
                <Input
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Acronimo</Label>
                <Input
                  value={editForm.acronimo}
                  onChange={(e) => setEditForm({ ...editForm, acronimo: e.target.value })}
                  maxLength={5}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Telefono</Label>
                <Input
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Direccion</Label>
              <Input
                value={editForm.direccion}
                onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Website</Label>
              <Input
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Hotel activo</Label>
                <Switch
                  checked={editForm.activo}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, activo: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Habilitado para eventos</Label>
                <Switch
                  checked={editForm.activoevento}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, activoevento: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Centro de consumo activo</Label>
                <Switch
                  checked={editForm.activocentroconsumo}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, activocentroconsumo: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoHotel(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditarHotel}
              disabled={saving}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
