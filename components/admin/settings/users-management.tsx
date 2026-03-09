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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Pencil,
  KeyRound,
  Search,
  UserPlus,
  Users,
  ShieldCheck,
  Mail,
} from "lucide-react"
import {
  crearUsuarioConfig,
  actualizarUsuarioConfig,
  resetPasswordUsuario,
} from "@/app/actions/configuraciones"

interface UsersManagementProps {
  usuarios: any[]
  roles: Array<{ id: number; nombre: string }>
  hoteles: any[]
  onRefresh: () => void
}

const ROL_COLORS: Record<string, string> = {
  "Admin Principal": "bg-purple-100 text-purple-800 border-purple-300",
  "Admin General": "bg-blue-100 text-blue-800 border-blue-300",
  "Gerente": "bg-amber-100 text-amber-800 border-amber-300",
  "Vendedor": "bg-lime-100 text-lime-800 border-lime-300",
}

export function UsersManagement({ usuarios, roles, hoteles, onRefresh }: UsersManagementProps) {
  const [busqueda, setBusqueda] = useState("")
  const [creandoUsuario, setCreandoUsuario] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState<any>(null)
  const [resetUsuario, setResetUsuario] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Form state for new user
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombrecompleto: "",
    email: "",
    usuario: "",
    password: "",
    telefono: "",
    rolid: 0,
    hotelids: [] as number[],
  })

  // Form state for edit user
  const [editForm, setEditForm] = useState({
    nombrecompleto: "",
    email: "",
    usuario: "",
    telefono: "",
    rolid: 0,
    activo: true,
    hotelids: [] as number[],
  })

  // Reset password state
  const [newPassword, setNewPassword] = useState("")

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!busqueda) return true
    const term = busqueda.toLowerCase()
    return (
      (u.nombrecompleto || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.usuario || "").toLowerCase().includes(term) ||
      (u.rol || "").toLowerCase().includes(term)
    )
  })

  async function handleCrearUsuario() {
    setSaving(true)
    try {
      const result = await crearUsuarioConfig(nuevoUsuario)
      if (result.success) {
        toast.success("Usuario creado exitosamente")
        setCreandoUsuario(false)
        setNuevoUsuario({
          nombrecompleto: "",
          email: "",
          usuario: "",
          password: "",
          telefono: "",
          rolid: 0,
          hotelids: [],
        })
        onRefresh()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Error al crear usuario")
    } finally {
      setSaving(false)
    }
  }

  function openEditDialog(usuario: any) {
    setEditForm({
      nombrecompleto: usuario.nombrecompleto || "",
      email: usuario.email || "",
      usuario: usuario.usuario || "",
      telefono: usuario.telefono || "",
      rolid: usuario.rolid || 0,
      activo: usuario.activo ?? true,
      hotelids: usuario.hotelesids || [],
    })
    setEditandoUsuario(usuario)
  }

  async function handleEditarUsuario() {
    if (!editandoUsuario) return
    setSaving(true)
    try {
      const uid = editandoUsuario.usuarioid || editandoUsuario.id
      const result = await actualizarUsuarioConfig(uid, editForm)
      if (result.success) {
        toast.success("Usuario actualizado exitosamente")
        setEditandoUsuario(null)
        onRefresh()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Error al actualizar usuario")
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!resetUsuario || !newPassword) return
    setSaving(true)
    try {
      const uid = resetUsuario.usuarioid || resetUsuario.id
      const result = await resetPasswordUsuario(uid, newPassword)
      if (result.success) {
        toast.success("Contrasena reseteada exitosamente")
        setResetUsuario(null)
        setNewPassword("")
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Error al resetear contrasena")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActivo(usuario: any) {
    const uid = usuario.usuarioid || usuario.id
    const nuevoEstado = !(usuario.activo ?? true)
    const result = await actualizarUsuarioConfig(uid, { activo: nuevoEstado })
    if (result.success) {
      toast.success(`Usuario ${nuevoEstado ? "activado" : "desactivado"}`)
      onRefresh()
    } else {
      toast.error(result.error)
    }
  }

  function toggleHotelSelection(hotelId: number, hotelIds: number[], setter: (ids: number[]) => void) {
    if (hotelIds.includes(hotelId)) {
      setter(hotelIds.filter((id) => id !== hotelId))
    } else {
      setter([...hotelIds, hotelId])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Users className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Gestion de Usuarios</h3>
            <p className="text-sm text-muted-foreground">
              {usuarios.length} usuarios registrados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>

          <Dialog open={creandoUsuario} onOpenChange={setCreandoUsuario}>
            <DialogTrigger asChild>
              <Button className="bg-foreground text-background hover:bg-foreground/90">
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del nuevo usuario. La contrasena sera hasheada automaticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-nombre">Nombre completo *</Label>
                  <Input
                    id="new-nombre"
                    value={nuevoUsuario.nombrecompleto}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombrecompleto: e.target.value })}
                    placeholder="Nombre Apellido"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-email">Email *</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={nuevoUsuario.email}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-usuario">Usuario *</Label>
                    <Input
                      id="new-usuario"
                      value={nuevoUsuario.usuario}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, usuario: e.target.value })}
                      placeholder="nombre.usuario"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">Contrasena *</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={nuevoUsuario.password}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                      placeholder="Min. 6 caracteres"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-telefono">Telefono</Label>
                    <Input
                      id="new-telefono"
                      value={nuevoUsuario.telefono}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })}
                      placeholder="(55) 1234-5678"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-rol">Rol *</Label>
                  <Select
                    value={nuevoUsuario.rolid ? String(nuevoUsuario.rolid) : ""}
                    onValueChange={(val) => setNuevoUsuario({ ...nuevoUsuario, rolid: Number(val) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((rol) => (
                        <SelectItem key={rol.id} value={String(rol.id)}>
                          {rol.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Hoteles asignados</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 max-h-[150px] overflow-y-auto">
                    {hoteles.map((hotel: any) => {
                      const hid = hotel.hotelid || hotel.id
                      const selected = nuevoUsuario.hotelids.includes(hid)
                      return (
                        <Badge
                          key={hid}
                          variant={selected ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selected
                              ? "bg-foreground text-background"
                              : "hover:bg-muted"
                          }`}
                          onClick={() =>
                            toggleHotelSelection(
                              hid,
                              nuevoUsuario.hotelids,
                              (ids) => setNuevoUsuario({ ...nuevoUsuario, hotelids: ids })
                            )
                          }
                        >
                          {hotel.nombre}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreandoUsuario(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCrearUsuario}
                  disabled={saving || !nuevoUsuario.nombrecompleto || !nuevoUsuario.email || !nuevoUsuario.password || !nuevoUsuario.rolid}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {saving ? "Creando..." : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <Card className="rounded-xl border border-border/50 bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Hoteles</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead className="text-center">Ultimo Ingreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                usuariosFiltrados.map((usuario: any, idx: number) => {
                  const uid = `${usuario.usuarioid || usuario.id || "u"}-${idx}`
                  const rolColor = ROL_COLORS[usuario.rol] || "bg-muted text-foreground border-border"
                  return (
                    <TableRow key={uid}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {(usuario.nombrecompleto || "?")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{usuario.nombrecompleto}</p>
                            <p className="text-xs text-muted-foreground">@{usuario.usuario}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {usuario.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${rolColor} text-xs`}>
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          {usuario.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(usuario.hotelesNombres || []).length > 0 ? (
                            (usuario.hotelesNombres || []).slice(0, 2).map((h: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {h}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin hotel</span>
                          )}
                          {(usuario.hotelesNombres || []).length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(usuario.hotelesNombres || []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={usuario.activo ?? true}
                          onCheckedChange={() => handleToggleActivo(usuario)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs text-muted-foreground">
                          {usuario.ultimoingreso
                            ? new Date(usuario.ultimoingreso).toLocaleDateString("es-MX", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Nunca"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(usuario)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setResetUsuario(usuario)
                              setNewPassword("")
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editandoUsuario} onOpenChange={(open) => !open && setEditandoUsuario(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario. Los cambios se guardan inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nombre completo</Label>
              <Input
                value={editForm.nombrecompleto}
                onChange={(e) => setEditForm({ ...editForm, nombrecompleto: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Usuario</Label>
                <Input
                  value={editForm.usuario}
                  onChange={(e) => setEditForm({ ...editForm, usuario: e.target.value })}
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
                <Label>Rol</Label>
                <Select
                  value={editForm.rolid ? String(editForm.rolid) : ""}
                  onValueChange={(val) => setEditForm({ ...editForm, rolid: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={String(rol.id)}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Hoteles asignados</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 max-h-[150px] overflow-y-auto">
                {hoteles.map((hotel: any) => {
                  const hid = hotel.hotelid || hotel.id
                  const selected = editForm.hotelids.includes(hid)
                  return (
                    <Badge
                      key={hid}
                      variant={selected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        selected ? "bg-foreground text-background" : "hover:bg-muted"
                      }`}
                      onClick={() =>
                        toggleHotelSelection(
                          hid,
                          editForm.hotelids,
                          (ids) => setEditForm({ ...editForm, hotelids: ids })
                        )
                      }
                    >
                      {hotel.nombre}
                    </Badge>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.activo}
                onCheckedChange={(checked) => setEditForm({ ...editForm, activo: checked })}
              />
              <Label>Usuario activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoUsuario(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditarUsuario}
              disabled={saving}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={!!resetUsuario} onOpenChange={(open) => !open && setResetUsuario(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetear Contrasena</AlertDialogTitle>
            <AlertDialogDescription>
              Estas a punto de cambiar la contrasena de{" "}
              <span className="font-semibold text-foreground">
                {resetUsuario?.nombrecompleto}
              </span>
              . Ingresa la nueva contrasena.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reset-password">Nueva contrasena</Label>
            <Input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={saving || newPassword.length < 6}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {saving ? "Reseteando..." : "Resetear Contrasena"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
