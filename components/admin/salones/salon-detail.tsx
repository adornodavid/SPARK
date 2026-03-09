"use client"

import { useState } from "react"
import type { oSalon, oMontajeXSalon } from "@/types/salones"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Ruler,
  Maximize2,
  Users,
  DollarSign,
  CheckCircle2,
  ImageIcon,
  Video,
  FileText,
  Box,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Clock,
  CalendarDays,
} from "lucide-react"
import Link from "next/link"

/* ==================================================
  Types
================================================== */
interface SalonDetailProps {
  salon: oSalon
  montajes: oMontajeXSalon[]
}

/* ==================================================
  Component: Photo Gallery with Lightbox
================================================== */
function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!photos || photos.length === 0) return null

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % photos.length)
    }
  }

  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)
    }
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ImageIcon className="h-4 w-4 text-lime-600" />
          {title}
        </h3>
        {/* Main image */}
        {photos.length > 0 && (
          <div
            className="relative cursor-pointer overflow-hidden rounded-xl aspect-[16/9]"
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src={photos[0]}
              alt={`${title} principal`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {photos.length > 1 && (
              <Badge className="absolute bottom-3 right-3 bg-black/70 text-white border-0">
                +{photos.length - 1} fotos
              </Badge>
            )}
          </div>
        )}
        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((url, i) => (
              <button
                key={url}
                onClick={() => setLightboxIndex(i)}
                className="flex-shrink-0 h-16 w-16 overflow-hidden rounded-lg border-2 border-transparent hover:border-lime-500 transition-colors"
              >
                <img
                  src={url}
                  alt={`Miniatura ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0" showCloseButton={false}>
          <DialogTitle className="sr-only">Galería de fotos</DialogTitle>
          {lightboxIndex !== null && (
            <div className="relative flex items-center justify-center min-h-[60vh]">
              <img
                src={photos[lightboxIndex]}
                alt={`Foto ${lightboxIndex + 1}`}
                className="max-h-[85vh] max-w-full object-contain rounded"
              />

              {/* Close button */}
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-3 right-3 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Navigation */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={goNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Counter */}
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                {lightboxIndex + 1} / {photos.length}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ==================================================
  Component: Video Section
================================================== */
function VideoSection({ videos }: { videos: string[] }) {
  if (!videos || videos.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Video className="h-4 w-4 text-lime-600" />
        Videos
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {videos.map((url, i) => (
          <div key={url} className="overflow-hidden rounded-xl border">
            <video
              src={url}
              controls
              preload="metadata"
              className="w-full aspect-video bg-black"
            >
              Tu navegador no soporta video HTML5.
            </video>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ==================================================
  Component: Floor Plans Section
================================================== */
function FloorPlansSection({ planos }: { planos: string[] }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  if (!planos || planos.length === 0) return null

  const isPdf = (url: string) => /\.pdf$/i.test(url)

  return (
    <>
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText className="h-4 w-4 text-lime-600" />
          Planos
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {planos.map((url, i) =>
            isPdf(url) ? (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted transition-colors"
              >
                <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Plano {i + 1}</p>
                  <p className="text-xs text-muted-foreground">Abrir PDF</p>
                </div>
              </a>
            ) : (
              <button
                key={url}
                onClick={() => setPreviewUrl(url)}
                className="overflow-hidden rounded-lg border hover:border-lime-500 transition-colors"
              >
                <img
                  src={url}
                  alt={`Plano ${i + 1}`}
                  className="w-full aspect-[4/3] object-cover"
                />
              </button>
            ),
          )}
        </div>
      </div>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">Vista previa de plano</DialogTitle>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Plano"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ==================================================
  Component: Renders Section
================================================== */
function RendersSection({ renders }: { renders: string[] }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  if (!renders || renders.length === 0) return null

  return (
    <>
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Box className="h-4 w-4 text-lime-600" />
          Renders 3D
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {renders.map((url, i) => (
            <button
              key={url}
              onClick={() => setPreviewUrl(url)}
              className="overflow-hidden rounded-lg border hover:border-lime-500 transition-colors"
            >
              <img
                src={url}
                alt={`Render ${i + 1}`}
                className="w-full aspect-[4/3] object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">Vista previa de render</DialogTitle>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Render 3D"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ==================================================
  Main Component: SalonDetail
================================================== */
export function SalonDetail({ salon, montajes }: SalonDetailProps) {
  // Parse JSON arrays from salon data
  const fotos = parseMediaArray(salon.fotos)
  const videos = parseMediaArray(salon.videos)
  const planos = parseMediaArray(salon.planos)
  const renders = parseMediaArray(salon.renders)
  const equipoincluido = parseEquipmentArray(salon.equipoincluido)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">{salon.nombre}</h1>
            <Badge variant={salon.activo ? "default" : "secondary"} className={salon.activo ? "bg-lime-600" : ""}>
              {salon.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          {salon.hotel && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {salon.hotel}
            </p>
          )}
          {salon.descripcion && (
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{salon.descripcion}</p>
          )}
        </div>
        <Button asChild>
          <Link href={`/salones/${salon.id}/editar`}>
            Editar Salón
          </Link>
        </Button>
      </div>

      {/* Photo Gallery */}
      <PhotoGallery photos={fotos} title="Galería de Fotos" />

      {/* Technical Specs + Equipment - Side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Technical Specs Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Especificaciones Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Dimensions */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  Dimensiones (L x A x H)
                </p>
                <p className="text-sm font-medium">
                  {salon.longitud || "—"} x {salon.ancho || "—"} x {salon.altura || "—"} m
                </p>
              </div>

              {/* Area */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Maximize2 className="h-3 w-3" />
                  Área
                </p>
                <p className="text-sm font-medium">
                  {salon.aream2 ? `${salon.aream2} m²` : "—"}
                </p>
              </div>

              {/* Capacity */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Capacidad
                </p>
                <p className="text-sm font-medium">
                  {salon.capacidadminima && salon.capacidadmaxima
                    ? `${salon.capacidadminima} — ${salon.capacidadmaxima} personas`
                    : salon.capacidadmaxima
                      ? `Hasta ${salon.capacidadmaxima} personas`
                      : "—"}
                </p>
              </div>

              {/* Price per hour */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Precio por hora
                </p>
                <p className="text-sm font-medium">
                  {salon.precioporhora
                    ? `$${salon.precioporhora.toLocaleString("es-MX")} MXN`
                    : "—"}
                </p>
              </div>

              {/* Price per day */}
              <div className="space-y-1 col-span-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Precio por día
                </p>
                <p className="text-sm font-medium">
                  {salon.preciopordia
                    ? `$${salon.preciopordia.toLocaleString("es-MX")} MXN`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Included */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-lime-600" />
              Equipo Incluido
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipoincluido.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {equipoincluido.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-lime-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay equipo registrado para este salón
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Videos */}
      {videos.length > 0 && (
        <>
          <Separator />
          <VideoSection videos={videos} />
        </>
      )}

      {/* Floor Plans */}
      {planos.length > 0 && (
        <>
          <Separator />
          <FloorPlansSection planos={planos} />
        </>
      )}

      {/* Renders */}
      {renders.length > 0 && (
        <>
          <Separator />
          <RendersSection renders={renders} />
        </>
      )}

      {/* Montajes */}
      <Separator />
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Montajes Disponibles
        </h3>
        {montajes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {montajes.map((montaje, i) => (
              <Card key={i} className="overflow-hidden">
                {/* Montaje image if available */}
                {montaje.fotos && parseMediaArray(montaje.fotos).length > 0 && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={parseMediaArray(montaje.fotos)[0]}
                      alt={montaje.montaje || "Montaje"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm">{montaje.montaje || "Sin nombre"}</h4>
                  {montaje.descripcion && (
                    <p className="text-xs text-muted-foreground mt-1">{montaje.descripcion}</p>
                  )}
                  <div className="mt-3 space-y-1.5">
                    {(montaje.capacidadminima || montaje.capacidadmaxima) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>
                          {montaje.capacidadminima && montaje.capacidadmaxima
                            ? `${montaje.capacidadminima} — ${montaje.capacidadmaxima} personas`
                            : montaje.capacidadmaxima
                              ? `Hasta ${montaje.capacidadmaxima}`
                              : `Desde ${montaje.capacidadminima}`}
                        </span>
                      </div>
                    )}
                    {montaje.m2 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Maximize2 className="h-3 w-3" />
                        <span>{montaje.m2} m²</span>
                      </div>
                    )}
                    {(montaje.longitud || montaje.ancho || montaje.altura) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Ruler className="h-3 w-3" />
                        <span>
                          {montaje.longitud || "—"} x {montaje.ancho || "—"} x {montaje.altura || "—"} m
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay montajes asignados a este salón
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/* ==================================================
  Helpers
================================================== */
function parseMediaArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string")
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter((v: unknown) => typeof v === "string")
    } catch {
      // If it's a single URL string
      if (value.startsWith("http")) return [value]
    }
  }
  return []
}

function parseEquipmentArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string")
  if (typeof value === "object" && value !== null) {
    // If it's an object like { "Proyector": true, "Pantalla": true }
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v === true)
      .map(([k]) => k)
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter((v: unknown) => typeof v === "string")
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed as Record<string, unknown>)
          .filter(([, v]) => v === true)
          .map(([k]) => k)
      }
    } catch {
      return []
    }
  }
  return []
}
