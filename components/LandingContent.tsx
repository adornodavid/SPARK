"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Users,
  Square,
  Building2,
  ChevronLeft,
  ChevronRight,
  LucideClipboard as FileClipboard,
  Video,
  Bed,
  Tag,
  UtensilsCrossed,
  UserCheck,
  Car,
  Star,
} from "lucide-react"
import { obtenerHoteles } from "@/app/actions/hoteles"
import SalonesSlider from "@/components/SalonesSlider"

export default function LandingContent() {
  const searchParams = useSearchParams()
  const hotelIdFromUrl = searchParams.get("hotelId")

  const [currentGalleryImage, setCurrentGalleryImage] = useState(0)
  const [hotelData, setHotelData] = useState<any>(null)
  const [isLoadingHotel, setIsLoadingHotel] = useState(true)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string>("")

  const allPhotos = hotelData?.fotos
    ? (() => {
        console.log("[v0] Landing - Columna fotos raw:", hotelData.fotos)
        console.log("[v0] Landing - Tipo de fotos:", typeof hotelData.fotos)
        console.log("[v0] Landing - Es array?:", Array.isArray(hotelData.fotos))

        // Si ya es un array, usarlo directamente
        if (Array.isArray(hotelData.fotos)) {
          console.log("[v0] Landing - Es array, usando directamente:", hotelData.fotos)
          return hotelData.fotos
        }

        // Si es string, intentar parsear como JSON
        if (typeof hotelData.fotos === "string") {
          try {
            const parsed = JSON.parse(hotelData.fotos)
            console.log("[v0] Landing - Fotos parseadas:", parsed)
            return Array.isArray(parsed) ? parsed : [hotelData.fotos]
          } catch (error) {
            console.log("[v0] Landing - Error parseando JSON, usando como string simple")
            return [hotelData.fotos]
          }
        }

        // Fallback: convertir a array
        return [hotelData.fotos]
      })()
    : [
        "/elegant-conference-room.jpg",
        "/modern-conference-hall-blue-chairs.jpg",
        "/colorful-event-space-pink-chairs.jpg",
      ]

  // Primera foto para el banner
  const bannerImage = allPhotos[0] || "/elegant-banquet-hall-setup-wedding-reception-luxur.jpg"

  // Resto de fotos para la galería (desde la segunda en adelante)
  const galleryImages = allPhotos.length > 1 ? allPhotos.slice(1) : []

  console.log("[v0] Landing - Banner image:", bannerImage)
  console.log("[v0] Landing - Gallery images:", galleryImages)
  console.log("[v0] Landing - Total all photos:", allPhotos.length)

  const benefits = [
    { icon: Users, title: "Amplios espacios", description: "" },
    { icon: FileClipboard, title: "Montajes de gran producción", description: "" },
    { icon: Video, title: "Mobiliario y equipo audiovisual", description: "" },
    { icon: Bed, title: "303 Habitaciones amplias y equipadas", description: "" },
    { icon: Tag, title: "Tarifas especiales para invitados", description: "" },
    { icon: UtensilsCrossed, title: "Catering", description: "" },
    { icon: UserCheck, title: "Asesores expertos", description: "" },
    { icon: Car, title: "Descuento de estacionamiento", description: "" },
  ]

  const nextGalleryImage = () => {
    setCurrentGalleryImage((prev) => (prev + 1) % galleryImages.length)
  }

  const prevGalleryImage = () => {
    setCurrentGalleryImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  useEffect(() => {
    const fetchHotelData = async () => {
      console.log("[v0] Landing - Iniciando carga de hotel...")
      console.log("[v0] Landing - Hotel ID from URL:", hotelIdFromUrl)
      setIsLoadingHotel(true)

      const resultado = hotelIdFromUrl ? await obtenerHoteles(Number(hotelIdFromUrl)) : await obtenerHoteles()

      console.log("[v0] Landing - Resultado obtenerHoteles:", resultado)
      if (resultado.success && resultado.data && resultado.data.length > 0) {
        console.log("[v0] Landing - Hotel obtenido:", resultado.data[0])
        setHotelData(resultado.data[0])
      } else {
        console.log("[v0] Landing - No se obtuvo hotel o error")
      }
      setIsLoadingHotel(false)
    }
    fetchHotelData()
  }, [hotelIdFromUrl])

  return (
    <div className="min-h-screen bg-[#fffdfb]">
      {/* Banner Section */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <img src={bannerImage || "/placeholder.svg"} alt="Hotel Banner" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
      </section>

      {/* Hotel Info Section */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">
                {hotelData?.ciudad || "Monterrey"}, {hotelData?.estado || "Nuevo León"}
              </span>
            </div>
            <h1 className="mb-6 text-4xl font-bold text-gray-900 lg:text-5xl">
              {hotelData?.nombre || "MS Milenium Monterrey Curio Collection by Hilton"}
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
              <div className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <Square className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Área total</p>
                  <p className="text-2xl font-bold text-gray-900">{hotelData?.aream2 || "2,057"} m²</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Users className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Cap. máxima</p>
                  <p className="text-2xl font-bold text-gray-900">{hotelData?.capacidadmaxima || "600"} Personas</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                  <Building2 className="h-7 w-7 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Habitaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{hotelData?.totalcuartos || "303"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <UtensilsCrossed className="h-7 w-7 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Restaurantes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {hotelData?.activocentroconsumo ? "Disponible" : "No disponible"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
                  <Star className="h-7 w-7 fill-yellow-500 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Categoría</p>
                  <div className="flex gap-1">
                    {hotelData?.estrellas
                      ? Array.from({ length: hotelData.estrellas }).map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        ))
                      : Array.from({ length: 4 }).map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section with Navigation Tabs */}
      <section id="acerca-de" className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 border-b border-gray-300">
          <nav className="flex gap-8">
            <a
              href="#acerca-de"
              onClick={(e) => handleNavClick(e, "acerca-de")}
              className="border-b-2 border-blue-600 pb-3 text-base font-medium text-blue-600"
            >
              Acerca de
            </a>
            <a
              href="#galeria"
              onClick={(e) => handleNavClick(e, "galeria")}
              className="border-b-2 border-transparent pb-3 text-base font-medium text-gray-600 hover:text-gray-900"
            >
              Galería
            </a>
            <a
              href="#salones"
              onClick={(e) => handleNavClick(e, "salones")}
              className="border-b-2 border-transparent pb-3 text-base font-medium text-gray-600 hover:text-gray-900"
            >
              Salones y Montajes
            </a>
            <a
              href="#beneficios"
              onClick={(e) => handleNavClick(e, "beneficios")}
              className="border-b-2 border-transparent pb-3 text-base font-medium text-gray-600 hover:text-gray-900"
            >
              Beneficios
            </a>
            <a
              href="#ubicacion"
              onClick={(e) => handleNavClick(e, "ubicacion")}
              className="border-b-2 border-transparent pb-3 text-base font-medium text-gray-600 hover:text-gray-900"
            >
              Ubicación
            </a>
          </nav>
        </div>

        <h2 className="text-3xl font-bold text-gray-900">Acerca de</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 col-span-2">
            <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
              {hotelData?.descripcion ||
                `Ubicado en la mejor y exclusiva Zona de Valle, en San Pedro Garza García, el Hotel MS Milenium Monterrey, Curio Collection by Hilton, facilita el traslado a cualquier punto de la ciudad, por lo que es el mejor lugar para realizar eventos únicos y exclusivos.`}
            </p>
          </div>
          <div className="flex items-center justify-center">
            {hotelData?.videopresentativo ? (
              <video
                src={hotelData.videopresentativo}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full max-w-[350px] h-auto aspect-[9/14] rounded-lg shadow-xl object-cover"
              />
            ) : (
              <div className="w-full max-w-[350px] aspect-[9/12] rounded-lg bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">Video no disponible</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galeria" className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-8 text-3xl font-bold text-gray-900"></h2>
        {galleryImages.length > 0 ? (
          <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-center gap-4">
              <div
                className="relative h-[300px] w-[280px] flex-shrink-0 overflow-hidden rounded-lg opacity-70 transition-all hover:opacity-90 cursor-pointer hover:scale-105"
                onClick={() => {
                  setSelectedGalleryImage(
                    galleryImages[(currentGalleryImage - 1 + galleryImages.length) % galleryImages.length],
                  )
                  setIsGalleryModalOpen(true)
                }}
              >
                <img
                  src={
                    galleryImages[(currentGalleryImage - 1 + galleryImages.length) % galleryImages.length] ||
                    "/placeholder.svg?height=300&width=280" ||
                    "/placeholder.svg"
                  }
                  alt="Gallery Previous"
                  className="h-full w-full object-cover"
                />
              </div>

              <div
                className="relative h-[400px] w-[450px] flex-shrink-0 overflow-hidden rounded-xl shadow-2xl cursor-pointer transition-transform hover:scale-105"
                onClick={() => {
                  setSelectedGalleryImage(galleryImages[currentGalleryImage])
                  setIsGalleryModalOpen(true)
                }}
              >
                <img
                  src={galleryImages[currentGalleryImage] || "/placeholder.svg?height=400&width=450"}
                  alt={`Gallery ${currentGalleryImage + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>

              <div
                className="relative h-[300px] w-[280px] flex-shrink-0 overflow-hidden rounded-lg opacity-70 transition-all hover:opacity-90 cursor-pointer hover:scale-105"
                onClick={() => {
                  setSelectedGalleryImage(galleryImages[(currentGalleryImage + 1) % galleryImages.length])
                  setIsGalleryModalOpen(true)
                }}
              >
                <img
                  src={
                    galleryImages[(currentGalleryImage + 1) % galleryImages.length] ||
                    "/placeholder.svg?height=300&width=280" ||
                    "/placeholder.svg"
                  }
                  alt="Gallery Next"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white"
              onClick={prevGalleryImage}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white"
              onClick={nextGalleryImage}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <div className="mt-6 flex justify-center gap-2">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentGalleryImage(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentGalleryImage ? "w-8 bg-gray-800" : "bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600 py-12">No hay imágenes adicionales en la galería</div>
        )}
      </section>

      {/* Gallery Image Modal */}
      {isGalleryModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setIsGalleryModalOpen(false)}
        >
          <button
            onClick={() => setIsGalleryModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedGalleryImage || "/placeholder.svg"}
              alt="Gallery Full Size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Salones y Montajes Section */}
      <section id="salones" className="relative py-20 bg-[#fffdfb]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Salones y Montajes</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestros espacios versátiles diseñados para hacer de tu evento una experiencia inolvidable
            </p>
          </div>

          {isLoadingHotel ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-gray-600">Cargando información del hotel...</div>
            </div>
          ) : hotelData?.hotelid ? (
            <SalonesSlider hotelId={hotelData.hotelid} />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-gray-600">No se pudo cargar la información del hotel</div>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="mx-auto max-w-7xl px-6 py-6">
        <h2 className="mb-8 text-3xl font-bold text-gray-900">Beneficios</h2>
        <div className="grid gap-8 sm:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{benefit.title}</h3>
              </div>
            )
          })}
        </div>
      </section>

      {/* Location Section */}
      <section id="ubicacion" className="mx-auto max-w-7xl px-6 py-6">
        <h2 className="mb-4 text-3xl font-bold text-gray-900">Ubicación</h2>
        <p className="mb-6 text-lg text-gray-600">
          {hotelData?.direccion ||
            "José Vasconcelos No. 300 Ote. Residencial San Agustín, San Pedro Garza García, NL, México 66260"}
        </p>
        <div className="overflow-hidden rounded-2xl shadow-xl">
          <div className="h-[500px] w-full bg-gray-200">
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                hotelData?.direccion || "Retorno Fundidora : 100, Obrera, 64010 Monterrey, N.L.",
              )}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer
        className="relative mt-16 bg-cover bg-center bg-no-repeat py-12 text-white"
        style={{ backgroundImage: "url('/images/fondofooter.png')" }}
      >
        <div className="absolute inset-0"></div>
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-4 text-xl font-bold">{hotelData?.nombre || "MS Milenium Monterrey"}</h3>
              <p className="text-sm leading-relaxed text-white/90">
                Curio Collection by Hilton, el mejor lugar para realizar eventos únicos y exclusivos en Monterrey.
              </p>
              <div className="mt-6 flex justify-start">
                <img src="/images/milenium-logo.png" alt="Milenium Logo" className="h-16 w-auto" />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-bold">Contacto</h3>
              <div className="space-y-2 text-sm text-white/90">
                <p>{hotelData?.direccion || "José Vasconcelos No. 300 Ote."}</p>
                <p className="mt-3">Tel: {hotelData?.telefono || "(81) 8369 6043"}</p>
                <p>Email: {hotelData?.email || "leslie.martinez@hotelesmilenium.com"}</p>
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-xl font-bold">Horarios</h3>
              <div className="space-y-2 text-sm text-white/90">
                <p>Lunes a Viernes: 9:00 AM - 6:00 PM</p>
                <p>Sábado: 10:00 AM - 2:00 PM</p>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/20 pt-8 text-center text-sm text-white/80">
            <p>&copy; 2025 {hotelData?.nombre || "MS Milenium Monterrey"}. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
