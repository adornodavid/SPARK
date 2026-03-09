"use client"

import { useState, useRef } from "react"
import { subirArchivoSalon, eliminarArchivoSalon, actualizarMediaSalon } from "@/app/actions/salones"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  Upload,
  X,
  ImageIcon,
  Video,
  FileText,
  Box,
  Loader2,
  Trash2,
  ZoomIn,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

/* ==================================================
  Types
================================================== */
type MediaType = "fotos" | "videos" | "planos" | "renders"

interface MediaUploadProps {
  salonId: number
  mediaType: MediaType
  currentFiles: string[]
  onFilesChange: (files: string[]) => void
  title?: string
  description?: string
  maxFiles?: number
}

interface UploadingFile {
  id: string
  name: string
  progress: number
  status: "uploading" | "complete" | "error"
  errorMessage?: string
}

/* ==================================================
  Config por tipo de media
================================================== */
const mediaConfig: Record<MediaType, {
  icon: typeof ImageIcon
  acceptedTypes: string
  label: string
  description: string
}> = {
  fotos: {
    icon: ImageIcon,
    acceptedTypes: "image/jpeg,image/png,image/webp,image/gif",
    label: "Fotos",
    description: "JPG, PNG, WEBP o GIF. Max 10MB por archivo.",
  },
  videos: {
    icon: Video,
    acceptedTypes: "video/mp4,video/webm,video/quicktime",
    label: "Videos",
    description: "MP4, WebM o MOV. Max 50MB por archivo.",
  },
  planos: {
    icon: FileText,
    acceptedTypes: "application/pdf,image/jpeg,image/png,image/webp",
    label: "Planos",
    description: "PDF, JPG, PNG o WEBP. Max 10MB por archivo.",
  },
  renders: {
    icon: Box,
    acceptedTypes: "image/jpeg,image/png,image/webp",
    label: "Renders 3D",
    description: "JPG, PNG o WEBP. Max 10MB por archivo.",
  },
}

/* ==================================================
  Component
================================================== */
export function MediaUpload({
  salonId,
  mediaType,
  currentFiles,
  onFilesChange,
  title,
  description,
  maxFiles = 20,
}: MediaUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = mediaConfig[mediaType]
  const Icon = config.icon

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
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
    // Reset input for re-selecting same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadFiles = async (files: File[]) => {
    // Check max files
    const remaining = maxFiles - currentFiles.length
    if (remaining <= 0) {
      toast.error(`Ya se alcanzó el máximo de ${maxFiles} archivos`)
      return
    }

    const filesToUpload = files.slice(0, remaining)
    if (filesToUpload.length < files.length) {
      toast.warning(`Solo se subirán ${filesToUpload.length} de ${files.length} archivos (límite: ${maxFiles})`)
    }

    const newUploadingFiles: UploadingFile[] = filesToUpload.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      name: file.name,
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

    const newUrls: string[] = []

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const uploadId = newUploadingFiles[i].id

      try {
        // Simulate progress (actual upload is atomic via FormData)
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadId ? { ...f, progress: 30 } : f)),
        )

        const formData = new FormData()
        formData.append("file", file)
        formData.append("salonId", salonId.toString())
        formData.append("mediaType", mediaType)

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadId ? { ...f, progress: 60 } : f)),
        )

        const result = await subirArchivoSalon(formData)

        if (result.success && result.url) {
          newUrls.push(result.url)

          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadId ? { ...f, progress: 100, status: "complete" } : f)),
          )
        } else {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadId
                ? { ...f, progress: 0, status: "error", errorMessage: result.error }
                : f,
            ),
          )
          toast.error(`Error subiendo ${file.name}: ${result.error}`)
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

    // Update DB with all new URLs
    if (newUrls.length > 0) {
      const updatedFiles = [...currentFiles, ...newUrls]
      const dbResult = await actualizarMediaSalon(salonId, mediaType, updatedFiles)

      if (dbResult.success) {
        onFilesChange(updatedFiles)
        toast.success(`${newUrls.length} archivo(s) subido(s) correctamente`)
      } else {
        toast.error("Error al guardar en base de datos: " + dbResult.error)
      }
    }

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((f) => f.status === "uploading"))
    }, 2000)
  }

  const handleDelete = async (urlToDelete: string) => {
    setDeletingUrl(urlToDelete)

    try {
      // Delete from storage
      const storageResult = await eliminarArchivoSalon(urlToDelete)

      if (!storageResult.success) {
        toast.error("Error al eliminar archivo: " + storageResult.error)
        setDeletingUrl(null)
        return
      }

      // Update DB
      const updatedFiles = currentFiles.filter((url) => url !== urlToDelete)
      const dbResult = await actualizarMediaSalon(salonId, mediaType, updatedFiles)

      if (dbResult.success) {
        onFilesChange(updatedFiles)
        toast.success("Archivo eliminado correctamente")
      } else {
        toast.error("Error al actualizar base de datos: " + dbResult.error)
      }
    } catch {
      toast.error("Error al eliminar archivo")
    } finally {
      setDeletingUrl(null)
    }
  }

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url)
  }

  const isVideo = (url: string) => {
    return /\.(mp4|webm|mov)$/i.test(url)
  }

  const isPdf = (url: string) => {
    return /\.pdf$/i.test(url)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5 text-primary" />
            {title || config.label}
          </CardTitle>
          <CardDescription>{description || config.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-lg border-2 border-dashed p-6
              transition-colors duration-200 text-center
              ${isDragOver
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/60 hover:bg-muted"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={config.acceptedTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="mx-auto h-8 w-8 text-muted-foreground/70 mb-2" />
            <p className="text-sm font-medium text-foreground">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {config.description} &mdash; Máximo {maxFiles} archivos
            </p>
          </div>

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-2">
              {uploadingFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 rounded-md border p-2">
                  <Loader2
                    className={`h-4 w-4 ${file.status === "uploading" ? "animate-spin text-lime-600" : file.status === "complete" ? "text-green-600" : "text-red-600"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <Progress value={file.progress} className="h-1.5 mt-1" />
                  </div>
                  {file.status === "error" && (
                    <span className="text-xs text-red-600">{file.errorMessage}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Thumbnail Grid */}
          {currentFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {currentFiles.map((url, index) => (
                <div
                  key={url}
                  className="group relative rounded-lg border overflow-hidden bg-muted aspect-square"
                >
                  {/* Preview content */}
                  {isImage(url) ? (
                    <img
                      src={url}
                      alt={`${config.label} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : isVideo(url) ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Video className="h-10 w-10 text-muted-foreground/70" />
                      <span className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
                        Video
                      </span>
                    </div>
                  ) : isPdf(url) ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <FileText className="h-10 w-10 text-muted-foreground/70" />
                      <span className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
                        PDF
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Icon className="h-10 w-10 text-muted-foreground/70" />
                    </div>
                  )}

                  {/* Overlay actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                    {(isImage(url) || isVideo(url)) && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreviewUrl(url)}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      disabled={deletingUrl === url}
                      onClick={() => handleDelete(url)}
                    >
                      {deletingUrl === url ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Index badge */}
                  <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {currentFiles.length === 0 && uploadingFiles.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-2">
              No hay archivos de {config.label.toLowerCase()} cargados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-2 sm:max-w-5xl">
          <DialogTitle className="sr-only">Vista previa de media</DialogTitle>
          {previewUrl && isImage(previewUrl) && (
            <img
              src={previewUrl}
              alt="Vista previa"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
          {previewUrl && isVideo(previewUrl) && (
            <video
              src={previewUrl}
              controls
              autoPlay
              className="max-h-[80vh] w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
