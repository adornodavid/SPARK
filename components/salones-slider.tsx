"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { objetoSalones } from "@/app/actions/salones"
import type { oSalon } from "@/types/salones"
import Link from "next/link"

interface SalonesSliderProps {
  hotelId: number
}

export function SalonesSlider({ hotelId }: SalonesSliderProps) {
  const [salones, setSalones] = useState<oSalon[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSalones() {
      setIsLoading(true)
      const result = await objetoSalones("", -1, "Todos")
      if (result.success && result.data) {
        setSalones(result.data)
      }
      setIsLoading(false)
    }
    fetchSalones()
  }, [hotelId])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % salones.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + salones.length) % salones.length)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-gray-600">Cargando salones...</div>
      </div>
    )
  }

  if (salones.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-gray-600">No hay salones disponibles</div>
      </div>
    )
  }

  const currentSalon = salones[currentIndex]
  const fotosArray = Array.isArray(currentSalon.fotos) ? currentSalon.fotos : []
  const mainImage =
    fotosArray.length > 0
      ? String(fotosArray[0])
      : "/placeholder.svg?height=800&width=1200"
  const secondaryImage = fotosArray.length > 1 ? String(fotosArray[1]) : mainImage

  return (
    <div className="relative h-[600px] bg-gray-900 overflow-hidden group">
      {/* Main Layout Grid */}
      <div className="relative h-full grid grid-cols-12 gap-0">
        {/* Left Small Image */}
        <div className="col-span-3 relative overflow-hidden">
          <img
            src={secondaryImage || "/placeholder.svg"}
            alt={`${currentSalon.nombre} - Vista secundaria`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Right Large Image with Overlay Content */}
        <div className="col-span-9 relative overflow-hidden">
          <img
            src={mainImage || "/placeholder.svg"}
            alt={currentSalon.nombre ?? undefined}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

          {/* Overlay Content */}
          <div className="relative h-full flex flex-col items-center justify-center text-white px-8">
            <h2 className="text-7xl md:text-8xl font-bold mb-2 tracking-tight text-center leading-none">
              {currentSalon.nombre}
            </h2>
            <p className="text-lg md:text-xl tracking-widest mb-12 text-white/90">
              {currentSalon.descripcion || "Espacio para eventos especiales"}
            </p>

            {/* Minimalist Button */}
            <Link href="/landing/landingsalones">
              <button className="group/btn relative px-10 py-4 border-2 border-white text-white font-semibold tracking-wider text-lg transition-all duration-300 hover:bg-white hover:text-gray-900 overflow-hidden">
                <span className="relative z-10">Ver Salón</span>
                <div className="absolute inset-0 bg-white transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-300 origin-left -z-0" />
              </button>
            </Link>

            {/* Large Slide Number */}
            <div
              className="absolute bottom-8 left-8 text-8xl font-bold opacity-30 leading-none"
              style={{
                WebkitTextStroke: "2px white",
                WebkitTextFillColor: "transparent",
              }}
            >
              {String(currentIndex + 1).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 z-20"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-8 w-8 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all duration-300 z-20"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-8 w-8 text-white" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 right-8 flex gap-2 z-20">
        {salones.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 transition-all duration-300 ${
              index === currentIndex ? "w-12 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Ir al salón ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
