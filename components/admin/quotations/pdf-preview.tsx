"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { generarPDFCotizacion } from "@/app/actions/pdf"

interface PDFPreviewProps {
  cotizacionId: number
  folio?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
}

export function PDFPreview({
  cotizacionId,
  folio,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: PDFPreviewProps) {
  const [loading, setLoading] = useState(false)

  async function handleGenerarPDF(action: "download" | "preview") {
    setLoading(true)
    toast.info("Generando PDF...")

    try {
      const result = await generarPDFCotizacion(cotizacionId)

      if (!result.success || !result.pdfBase64) {
        toast.error(result.error || "Error al generar el PDF")
        setLoading(false)
        return
      }

      // Convert base64 to blob
      const byteCharacters = atob(result.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      if (action === "download") {
        // Download the file
        const link = document.createElement("a")
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("PDF descargado exitosamente")
      } else {
        // Preview in new tab
        window.open(url, "_blank")
        toast.success("PDF abierto en nueva pestana")
      }
    } catch {
      toast.error("Error inesperado al generar el PDF")
    }

    setLoading(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {showLabel && (
            <span className="ml-2">{loading ? "Generando..." : "PDF"}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleGenerarPDF("download")}>
          <Download className="h-4 w-4 mr-2" />
          Descargar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleGenerarPDF("preview")}>
          <Eye className="h-4 w-4 mr-2" />
          Vista Previa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
