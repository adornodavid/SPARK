"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Upload,
  FileText,
  ImageIcon,
  Loader2,
  Trash2,
  Download,
  ZoomIn,
  CreditCard,
  AlertTriangle,
} from "lucide-react"
import {
  subirComprobantePago,
  eliminarComprobantePago,
  obtenerComprobantesPago,
  verificarConflictoPago,
  type ComprobantePago,
} from "@/app/actions/pagos"

/* ==================================================
  Types
================================================== */
interface PaymentUploadProps {
  cotizacionId: number
  estatus: string
  onComprobantesChange?: (comprobantes: ComprobantePago[]) => void
}

interface UploadingFile {
  id: string
  name: string
  progress: number
  status: "uploading" | "complete" | "error"
  errorMessage?: string
}

/* ==================================================
  Helpers
================================================== */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(fileType: string): boolean {
  return fileType.startsWith("image/")
}

function isPdf(fileType: string): boolean {
  return fileType === "application/pdf"
}

/* ==================================================
  Component
================================================== */
export function PaymentUpload({ cotizacionId, estatus, onComprobantesChange }: PaymentUploadProps) {
  const [comprobantes, setComprobantes] = useState<ComprobantePago[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [conflictoInfo, setConflictoInfo] = useState<{
    hayConflicto: boolean
    conflictos: Array<{ id: number; folio: string; nombreevento: string; estatus: string; tieneComprobante: boolean }>
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar comprobantes al montar
  const loadComprobantes = async () => {
    const result = await obtenerComprobantesPago(cotizacionId)
    if (result.success) {
      setComprobantes(result.data)
      onComprobantesChange?.(result.data)
    }

    // Verificar conflictos
    const conflictoResult = await verificarConflictoPago(cotizacionId)
    if (conflictoResult.success) {
      setConflictoInfo({
        hayConflicto: conflictoResult.hayConflicto,
        conflictos: conflictoResult.conflictos,
      })
    }

    setLoaded(true)
  }

  // Load on first render
  if (!loaded) {
    loadComprobantes()
  }

  // Determinar si se puede subir archivos
  const canUpload = ["Enviada", "Aceptada", "Pagada"].includes(estatus)

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canUpload) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (!canUpload) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleUploadFiles(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleUploadFiles(files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadFiles = async (files: File[]) => {
    const maxFiles = 5
    const remaining = maxFiles - comprobantes.length
    if (remaining <= 0) {
      toast.error(`Ya se alcanzo el maximo de ${maxFiles} comprobantes`)
      return
    }

    const filesToUpload = files.slice(0, remaining)
    if (filesToUpload.length < files.length) {
      toast.warning(`Solo se subiran ${filesToUpload.length} de ${files.length} archivos (limite: ${maxFiles})`)
    }

    const newUploadingFiles: UploadingFile[] = filesToUpload.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      name: file.name,
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const uploadId = newUploadingFiles[i].id

      try {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadId ? { ...f, progress: 30 } : f)),
        )

        const formData = new FormData()
        formData.append("file", file)

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadId ? { ...f, progress: 60 } : f)),
        )

        const result = await subirComprobantePago(cotizacionId, formData)

        if (result.success && result.data) {
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadId ? { ...f, progress: 100, status: "complete" } : f)),
          )

          setComprobantes((prev) => {
            const updated = [...prev, result.data!]
            onComprobantesChange?.(updated)
            return updated
          })
          toast.success(`Comprobante subido: ${file.name}`)
        } else {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadId
                ? { ...f, progress: 0, status: "error", errorMessage: result.error }
                : f,
            ),
          )
          toast.error(result.error || `Error subiendo ${file.name}`)
        }
      } catch {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadId
              ? { ...f, progress: 0, status: "error", errorMessage: "Error inesperado" }
              : f,
          ),
        )
        toast.error(`Error subiendo ${file.name}`)
      }
    }

    // Limpiar uploads completados despues de un delay
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((f) => f.status === "uploading"))
    }, 2000)
  }

  const handleDelete = async (comprobanteId: string) => {
    setDeletingId(comprobanteId)

    try {
      const result = await eliminarComprobantePago(cotizacionId, comprobanteId)

      if (result.success) {
        setComprobantes((prev) => {
          const updated = prev.filter((c) => c.id !== comprobanteId)
          onComprobantesChange?.(updated)
          return updated
        })
        toast.success("Comprobante eliminado")
      } else {
        toast.error(result.error || "Error al eliminar comprobante")
      }
    } catch {
      toast.error("Error al eliminar comprobante")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <Card className="rounded-xl border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-lime-600" />
            Comprobantes de Pago
          </CardTitle>
          <CardDescription>
            PDF, JPG, JPEG o PNG. Max 10MB por archivo. Max 5 comprobantes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conflict Warning */}
          {conflictoInfo?.hayConflicto && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800">
                    Conflicto de fecha y salon
                  </p>
                  <p className="text-xs text-amber-700">
                    Existen otras cotizaciones para la misma fecha y salon. La primera en subir comprobante de pago tendra prioridad.
                  </p>
                  <div className="space-y-1 mt-2">
                    {conflictoInfo.conflictos.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-xs text-amber-700">
                        <span className="font-medium">{c.folio}</span>
                        <span>-</span>
                        <span>{c.nombreevento}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {c.estatus}
                        </Badge>
                        {c.tieneComprobante && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Ya tiene comprobante
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Drop Zone */}
          {canUpload ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative cursor-pointer rounded-lg border-2 border-dashed p-6
                transition-colors duration-200 text-center
                ${isDragOver
                  ? "border-lime-500 bg-lime-50"
                  : "border-border hover:border-lime-400 hover:bg-muted"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/70 mb-2" />
              <p className="text-sm font-medium text-foreground">
                Arrastra comprobantes aqui o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, JPEG, PNG &mdash; Max 10MB &mdash; Max 5 archivos
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {estatus === "Borrador"
                  ? "La cotizacion debe estar en estatus Enviada o Aceptada para subir comprobantes."
                  : estatus === "Confirmada" || estatus === "Realizada"
                    ? "La reservacion ya fue confirmada."
                    : "No se pueden subir comprobantes en el estatus actual."}
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-2">
              {uploadingFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 rounded-md border border-border p-2">
                  <Loader2
                    className={`h-4 w-4 shrink-0 ${
                      file.status === "uploading"
                        ? "animate-spin text-lime-600"
                        : file.status === "complete"
                          ? "text-emerald-600"
                          : "text-red-600"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <Progress value={file.progress} className="h-1.5 mt-1" />
                  </div>
                  {file.status === "error" && (
                    <span className="text-xs text-red-600 shrink-0">{file.errorMessage}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* File List */}
          {comprobantes.length > 0 && (
            <div className="space-y-2">
              {comprobantes.map((comprobante) => (
                <div
                  key={comprobante.id}
                  className="group flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Thumbnail / Icon */}
                  <div className="shrink-0 h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {isImage(comprobante.fileType) ? (
                      <img
                        src={comprobante.fileUrl}
                        alt={comprobante.fileName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-6 w-6 text-red-500" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {comprobante.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(comprobante.fileSize)}</span>
                      <span>&middot;</span>
                      <span>
                        {new Date(comprobante.fechaSubida).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isImage(comprobante.fileType) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreviewUrl(comprobante.fileUrl)}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    )}
                    <a
                      href={comprobante.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    {canUpload && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                            disabled={deletingId === comprobante.id}
                          >
                            {deletingId === comprobante.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar comprobante</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminara el archivo &quot;{comprobante.fileName}&quot; de forma permanente.
                              Esta accion no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(comprobante.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {comprobantes.length === 0 && uploadingFiles.length === 0 && loaded && (
            <p className="text-center text-sm text-muted-foreground py-2">
              No se han subido comprobantes de pago
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-2 sm:max-w-5xl">
          <DialogTitle className="sr-only">Vista previa de comprobante</DialogTitle>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Vista previa de comprobante"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
