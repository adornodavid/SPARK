"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from "lucide-react"
import { objetoSalones } from "@/app/actions/salones"
import type { oSalon } from "@/types/salones"
import { createPortal } from "react-dom"
import { useQuotations } from "@/contexts/quotations-context"

export default function LandingSalonesPage() {
  const [salones, setSalones] = useState<oSalon[]>([])
  const [currentSection, setCurrentSection] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedTables, setExpandedTables] = useState<{ [key: number]: boolean }>({})
  const [showGalleryModal, setShowGalleryModal] = useState<{ [key: number]: boolean }>({})
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({})
  const [montajesTableTab, setMontajesTableTab] = useState<{ [key: number]: "individual" | "comparison" }>({})
  const [animationKey, setAnimationKey] = useState(0)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const uniqueMontajes = Array.from(
    new Set(salones.flatMap((salon) => salon.montajes?.map((montaje) => montaje.montaje) || [])),
  )
  const [mounted, setMounted] = useState(false)
  const { addQuotation } = useQuotations()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchSalones() {
      try {
        const result = await objetoSalones("", -1, "Activo")
        console.log("salones", result)
        if (result.success && result.data) {
          setSalones(result.data)
        }
      } catch (error) {
        console.error("Error cargando salones:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSalones()
  }, [])

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth" })
    setCurrentSection(index)
    setAnimationKey((prev) => prev + 1)
  }

  const handleScroll = (direction: "up" | "down") => {
    if (direction === "up" && currentSection > 0) {
      scrollToSection(currentSection - 1)
    } else if (direction === "down" && currentSection < salones.length - 1) {
      scrollToSection(currentSection + 1)
    }
  }

  const toggleTable = (salonId: number) => {
    setExpandedTables((prev) => ({ ...prev, [salonId]: !prev[salonId] }))
    if (!expandedTables[salonId]) {
      setMontajesTableTab((prev) => ({ ...prev, [salonId]: "individual" }))
    }
  }

  const toggleGallery = (salonId: number) => {
    setShowGalleryModal((prev) => ({ ...prev, [salonId]: !prev[salonId] }))
    if (!currentImageIndex[salonId]) {
      setCurrentImageIndex((prev) => ({ ...prev, [salonId]: 0 }))
    }
  }

  const nextImage = (salonId: number, totalImages: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [salonId]: ((prev[salonId] || 0) + 1) % totalImages,
    }))
  }

  const prevImage = (salonId: number, totalImages: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [salonId]: ((prev[salonId] || 0) - 1 + totalImages) % totalImages,
    }))
  }

  const currentSalon = salones[currentSection]
  const isTableExpanded = expandedTables[currentSalon?.id || 0]
  const currentMontajesTab = montajesTableTab[currentSalon?.id || 0] || "individual"

  const handleCotizarSalon = (salon: oSalon) => {
    console.log("[v0] Adding quotation for salon:", salon.nombre)
    addQuotation({
      salonNombre: salon.nombre,
      hotelNombre: salon.hotel || "Hotel",
      direccion: "Dirección del hotel", // Note: direccion is not available in salon object
      hotelId: salon.hotelid?.toString() || "",
      salonId: salon.id?.toString() || "",
    })
    alert(`¡Cotización agregada! ${salon.nombre}`)
  }

  const MontajesModal = () => {
    if (!isTableExpanded || !mounted) return null

    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => toggleTable(currentSalon?.id || 0)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md w-[95vw] max-w-[1200px] max-h-[85vh] animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="h-full p-6 flex flex-col">
            <div className="mb-4 flex items-center justify-between flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMontajesTableTab((prev) => ({ ...prev, [currentSalon?.id || 0]: "individual" }))
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    currentMontajesTab === "individual"
                      ? "bg-teal-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Por Montaje
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMontajesTableTab((prev) => ({ ...prev, [currentSalon?.id || 0]: "comparison" }))
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    currentMontajesTab === "comparison"
                      ? "bg-teal-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Comparativa
                </button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTable(currentSalon?.id || 0)
                }}
                className="text-xs hover:bg-gray-200"
              >
                ✕ Cerrar
              </Button>
            </div>

            <div className="overflow-auto flex-1">
              {currentMontajesTab === "individual" ? (
                <table className="w-full border-collapse text-xs">
                  <thead className="sticky top-0 bg-teal-700 text-white">
                    <tr>
                      <th className="border border-teal-600 p-2">Montaje</th>
                      <th className="border border-teal-600 p-2">Capacidad Máxima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSalon?.montajes && currentSalon.montajes.length > 0 ? (
                      currentSalon.montajes.map((montaje: any, idx: number) => (
                        <tr key={idx} className="hover:bg-teal-50">
                          <td className="border border-gray-300 p-2 font-semibold">{montaje.montaje}</td>
                          <td className="border border-gray-300 p-2 text-center">{montaje.capacidadmaxima}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="border border-gray-300 p-4 text-center text-gray-500">
                          No hay montajes disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead className="sticky top-0 bg-teal-700 text-white">
                    <tr>
                      <th className="border border-teal-600 p-2 whitespace-nowrap">SALÓN</th>
                      {uniqueMontajes.map((montaje) => (
                        <th key={montaje} className="border border-teal-600 p-2 whitespace-nowrap">
                          {montaje}
                        </th>
                      ))}
                      <th className="border border-teal-600 p-2 whitespace-nowrap">Largo</th>
                      <th className="border border-teal-600 p-2 whitespace-nowrap">Ancho</th>
                      <th className="border border-teal-600 p-2 whitespace-nowrap">Alto</th>
                      <th className="border border-teal-600 p-2 whitespace-nowrap">M2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salones.map((salonItem: any, salonIdx: number) => {
                      const montajesMap: { [key: string]: number } = {}
                      salonItem.montajes?.forEach((m: any) => {
                        montajesMap[m.montaje] = m.capacidadmaxima
                      })

                      return (
                        <tr key={salonIdx} className="hover:bg-teal-50">
                          <td className="border border-gray-300 p-2 font-semibold whitespace-nowrap">
                            {salonItem.nombre}
                          </td>
                          {uniqueMontajes.map((montaje) => (
                            <td key={montaje} className="border border-gray-300 p-2 text-center">
                              {montajesMap[montaje] || "N/A"}
                            </td>
                          ))}
                          <td className="border border-gray-300 p-2 text-center">{salonItem.largo || "-"}</td>
                          <td className="border border-gray-300 p-2 text-center">{salonItem.ancho || "-"}</td>
                          <td className="border border-gray-300 p-2 text-center">{salonItem.alto || "-"}</td>
                          <td className="border border-gray-300 p-2 text-center">{salonItem.aream2 || "-"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  useEffect(() => {
    let isScrolling = false

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (isScrolling) return
      isScrolling = true

      if (e.deltaY > 0) {
        handleScroll("down")
      } else {
        handleScroll("up")
      }

      setTimeout(() => {
        isScrolling = false
      }, 800)
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [currentSection, salones.length])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-2xl font-semibold text-gray-600">Cargando salones...</div>
      </div>
    )
  }

  if (salones.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-2xl font-semibold text-gray-600">No hay salones disponibles</div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideDownSlow {
          from {
            transform: translateY(-150px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideUpSlow {
          from {
            transform: translateY(150px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeSlideDown {
          from {
            transform: translateY(-150px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .title-animation {
          animation: slideDownSlow 1.2s ease-out forwards;
        }

        .info-animation {
          animation: slideUpSlow 1.2s ease-out 0.3s forwards;
          opacity: 0;
        }

        .button-animation {
          animation: slideUpSlow 1.2s ease-out 0.3s forwards;
          opacity: 0;
        }

        .montajes-animation {
          animation: slideUpSlow 1.2s ease-out 0.3s forwards;
          opacity: 0;
        }

        .capacity-animation {
          animation: slideDownSlow 1.2s ease-out forwards;
          opacity: 0;
        }

        .gallery-animation {
          animation: slideDownSlow 1.2s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <nav className="fixed left-0 right-0 top-16 z-10 flex items-center justify-end gap-3 bg-background py-3 px-6 shadow-lg border-b border-white/10">
        <div className="flex gap-3 overflow-x-auto max-w-7xl">
          {salones.map((salon, index) => (
            <button
              key={salon.id}
              onClick={() => scrollToSection(index)}
              className={`rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all whitespace-nowrap ${
                currentSection === index
                  ? "bg-blue-600 text-white"
                  : "bg-white/95 text-gray-700 backdrop-blur-sm hover:bg-white"
              }`}
            >
              {salon.nombre}
            </button>
          ))}
        </div>
      </nav>

      <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 8rem)" }}>
        <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleScroll("up")}
            disabled={currentSection === 0}
            className="bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white disabled:opacity-30"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleScroll("down")}
            disabled={currentSection === salones.length - 1}
            className="bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white disabled:opacity-30"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>

        <div className="h-full snap-y snap-mandatory overflow-y-scroll">
          {salones.map((salon, index) => {
            const imagenSalon =
              salon.fotos && Array.isArray(salon.fotos) && salon.fotos[0]
                ? String(salon.fotos[0])
                : "/salon-de-eventos.jpg"

            const isGalleryModalOpen = showGalleryModal[salon.id || 0]
            const currentImgIndex = currentImageIndex[salon.id || 0] || 0
            const galleryImages = salon.fotos && Array.isArray(salon.fotos) ? salon.fotos.map(String) : [imagenSalon]

            return (
              <div
                key={salon.id}
                ref={(el) => {
                  sectionRefs.current[index] = el
                }}
                className="relative w-full snap-start snap-always overflow-hidden"
                style={{
                  height: "calc(100vh - 8rem)",
                  backgroundImage: `url(${imagenSalon})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/30" />

                <div className="relative z-10 flex h-full w-full flex-col justify-between px-12 py-12">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1
                        key={`title-${animationKey}-${index}`}
                        className="title-animation text-7xl font-serif font-bold text-white drop-shadow-2xl tracking-wide"
                        style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
                      >
                        {salon.nombre}
                      </h1>

                      {/* Gallery Icon - Moved below title */}
                      <div
                        key={`gallery-${animationKey}-${index}`}
                        onClick={() => toggleGallery(salon.id || 0)}
                        className="gallery-animation mt-4 inline-flex items-center gap-2 cursor-pointer rounded-lg border border-white/30 bg-white/55 px-4 py-2 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-2xl hover:border-white/50"
                      >
                        <div className="text-2xl">🖼️</div>
                        <p className="text-sm font-bold text-gray-800">Galería</p>
                      </div>
                    </div>

                    <div
                      key={`capacity-${animationKey}-${index}`}
                      className=""
                    >
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-ms font-semibold uppercase tracking-wider text-white">Capacidad Máxima</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-5xl font-bold text-teal-300">{salon.capacidadmaxima || 0}</p>
                          <span className="text-sm font-medium text-white">personas</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-end">
                    <div className="flex items-end gap-4">
                      <div key={`button-${animationKey}-${index}`} className="button-animation flex items-center">
                        <button
                          onClick={() => handleCotizarSalon(salon)}
                          className="group/btn relative z-10 px-8 py-3 bg-[#fffdfb] text-gray-800 border-2 border-gray-300 font-medium tracking-wider overflow-hidden transition-all duration-500 hover:text-white hover:scale-105 hover:shadow-xl"
                        >
                          <span className="relative z-10 flex items-center gap-2">Cotizar Salón</span>
                          <div className="absolute inset-0 bg-gray-500 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left -z-0" />
                        </button>
                      </div>

                      <div key={`montajes-${animationKey}-${index}`} className="montajes-animation">
                        {/* Icon Button - Always visible */}
                        <div
                          onClick={() => toggleTable(salon.id || 0)}
                          className="group cursor-pointer rounded-2xl border-2 border-white/30 bg-gradient-to-br from-[#efeee8] to-[#e5e3d9] shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:border-black/80 h-[100px] w-[100px] flex items-center justify-center"
                        >
                          <div className="text-center">
                            <div className="mb-1 text-4xl transform transition-transform group-hover:scale-110">📊</div>
                            <p className="text-[11px] font-bold text-gray drop-shadow-lg">Montajes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isGalleryModalOpen && (
                    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center">
                      <div className="relative w-full max-w-4xl h-[80vh] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-gray-900">Galería del Salón</h3>
                          <Button size="sm" variant="ghost" onClick={() => toggleGallery(salon.id || 0)}>
                            <X className="h-6 w-6" />
                          </Button>
                        </div>

                        <div className="relative h-[calc(100%-60px)] overflow-hidden rounded-lg">
                          <img
                            src={galleryImages[currentImgIndex] || "/placeholder.svg"}
                            alt={`${salon.nombre} - Imagen ${currentImgIndex + 1}`}
                            className="h-full w-full object-contain"
                          />

                          {galleryImages.length > 1 && (
                            <>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => prevImage(salon.id || 0, galleryImages.length)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm"
                              >
                                <ChevronLeft className="h-6 w-6" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => nextImage(salon.id || 0, galleryImages.length)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm"
                              >
                                <ChevronRight className="h-6 w-6" />
                              </Button>

                              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                                {galleryImages.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCurrentImageIndex((prev) => ({ ...prev, [salon.id || 0]: idx }))
                                    }}
                                    className={`h-3 w-3 rounded-full transition-all ${
                                      idx === currentImgIndex ? "w-10 bg-gray-900" : "bg-gray-400"
                                    }`}
                                  />
                                ))}
                              </div>

                              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                {currentImgIndex + 1} / {galleryImages.length}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <MontajesModal />
    </>
  )
}
