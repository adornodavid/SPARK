"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Mail, Phone } from "lucide-react"

interface Contact {
  id: string
  name: string
  position: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
}

interface ClientContactsProps {
  clientId: string
  initialContacts: Contact[]
}

export function ClientContacts({ clientId, initialContacts }: ClientContactsProps) {
  const [contacts, setContacts] = useState(initialContacts)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
    is_primary: false,
  })

  const handleAddContact = async () => {
    if (!formData.name) return

    setIsSubmitting(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("client_contacts")
      .insert({
        client_id: clientId,
        ...formData,
      })
      .select()
      .single()

    if (!error && data) {
      setContacts([...contacts, data])
      setFormData({
        name: "",
        position: "",
        email: "",
        phone: "",
        is_primary: false,
      })
      setIsOpen(false)
    }

    setIsSubmitting(false)
  }

  const handleDeleteContact = async (contactId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("client_contacts").delete().eq("id", contactId)

    if (!error) {
      setContacts(contacts.filter((c) => c.id !== contactId))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contactos Adicionales</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Contacto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Contacto</DialogTitle>
              <DialogDescription>Agrega un contacto adicional para este cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Puesto</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_primary"
                  checked={formData.is_primary}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_primary: checked as boolean,
                    })
                  }
                />
                <label
                  htmlFor="is_primary"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Contacto principal
                </label>
              </div>
              <Button onClick={handleAddContact} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Guardando..." : "Agregar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {contacts.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              No hay contactos adicionales registrados
            </CardContent>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{contact.name}</CardTitle>
                    {contact.position && <CardDescription>{contact.position}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.is_primary && <Badge variant="secondary">Principal</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteContact(contact.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
