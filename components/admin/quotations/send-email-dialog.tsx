"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Send, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

interface SendEmailDialogProps {
  cotizacionId: number
  folio: string
  clienteEmail?: string
  clienteNombre?: string
  nombreEvento?: string
  hotelNombre?: string
  trigger?: React.ReactNode
}

export function SendEmailDialog({
  cotizacionId,
  folio,
  clienteEmail,
  clienteNombre,
  nombreEvento,
  hotelNombre,
  trigger,
}: SendEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    to: clienteEmail || "",
    cc: "",
    subject: `Cotizacion ${folio} - ${nombreEvento || "Evento"} | ${hotelNombre || "MGHM"}`,
    mensaje: "",
  })

  // Reset form when dialog opens
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setFormData({
        to: clienteEmail || "",
        cc: "",
        subject: `Cotizacion ${folio} - ${nombreEvento || "Evento"} | ${hotelNombre || "MGHM"}`,
        mensaje: "",
      })
    }
    setOpen(isOpen)
  }

  async function handleEnviar() {
    if (!formData.to || !formData.to.includes("@")) {
      toast.error("Ingresa un email valido")
      return
    }

    setSending(true)
    toast.info("Enviando cotizacion por email...")

    try {
      // Dynamic import to avoid including server code in client bundle
      const response = await fetch("/api/enviar-cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cotizacionId,
          destinatarioEmail: formData.to,
          cc: formData.cc || undefined,
          mensaje: formData.mensaje || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Cotizacion enviada exitosamente")
        setOpen(false)
      } else {
        toast.error(result.error || "Error al enviar la cotizacion")
      }
    } catch {
      toast.error("Error inesperado al enviar el email")
    }

    setSending(false)
  }

  const defaultTrigger = (
    <Button variant="default" size="sm" className="bg-foreground text-background hover:bg-foreground/90">
      <Send className="h-4 w-4 mr-2" />
      Enviar por Email
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Enviar Cotizacion por Email
          </DialogTitle>
          <DialogDescription>
            Se adjuntara el PDF de la cotizacion <strong>{folio}</strong> al email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="email-to">
              Para <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email-to"
              type="email"
              placeholder="cliente@email.com"
              value={formData.to}
              onChange={(e) => setFormData((prev) => ({ ...prev, to: e.target.value }))}
            />
            {clienteNombre && (
              <p className="text-xs text-muted-foreground">
                Cliente: {clienteNombre}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-cc">CC (opcional)</Label>
            <Input
              id="email-cc"
              type="email"
              placeholder="copia@email.com"
              value={formData.cc}
              onChange={(e) => setFormData((prev) => ({ ...prev, cc: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Asunto</Label>
            <Input
              id="email-subject"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-mensaje">Mensaje personalizado (opcional)</Label>
            <Textarea
              id="email-mensaje"
              placeholder="Escriba un mensaje adicional para el cliente..."
              value={formData.mensaje}
              onChange={(e) => setFormData((prev) => ({ ...prev, mensaje: e.target.value }))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Si no escribe un mensaje, se usara el texto predeterminado.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button
            onClick={handleEnviar}
            disabled={sending || !formData.to}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Cotizacion
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
