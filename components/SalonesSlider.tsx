"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { objetoSalones } from "@/app/actions/salones"
import type { oSalon } from "@/types/salones"
import Link from "next/link"

interface SalonesSliderProps {
  hotelId: number
}

export default function SalonesSlider({ hotelId }: SalonesSliderProps) {
  const [salones, setSalones] = useState<oSalon[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    async function fetchSalones() {
      setIsLoading(true)
      const result = await objetoSalones("", hotelId, "Activo")
      if (result.success && result.data) {
        setSalones(result.data)
      }
      setIsLoading(false)
    }

    if (hotelId && hotelId > 0) {
      fetchSalones()
    } else {
      setIsLoading(false)
    }
  }, [hotelId])

  useEffect(() => {
    setAnimationKey((prev) => prev + 1)
  }, [currentIndex])

  const nextSlide = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % salones.length)
      setIsTransitioning(false)
    }, 600)
  }

  const prevSlide = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + salones.length) % salones.length)
      setIsTransitioning(false)
    }, 600)
  }

  const currentSalon = salones[currentIndex]

  if (isLoading || !currentSalon) {
    return (
      <div className="relative h-[600px] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando salones...</div>
      </div>
    )
  }

  if (salones.length === 0) {
    return (
      <div className="relative h-[600px] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">No hay salones disponibles</div>
      </div>
    )
  }

  const mainImage =
    currentSalon.fotos && Array.isArray(currentSalon.fotos) && currentSalon.fotos.length > 0
      ? currentSalon.fotos[0]
      : "/placeholder.svg?height=800&width=1200"

  const secondaryImage = currentSalon.imgurl || "/placeholder.svg?height=400&width=300"

  return (
    <>
      <style jsx>{`
        @keyframes slideDownSlow {
          from {
            transform: translateY(-200px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .text-slide-animation {
          animation: slideDownSlow 1.2s ease-out forwards;
        }
      `}</style>

      <div className="relative h-[600px] bg-gray-900 overflow-hidden group">
        {/* Main right image - fills most of the space */}
        <div className="absolute inset-0 h-full z-0" style={{ left: "158px", right: 0 }}>
          <img
            key={`main-${currentIndex}`}
            src={mainImage || "/placeholder.svg"}
            alt={currentSalon.nombre}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Curtain transition - left to right */}
          <div
            className={`absolute inset-0 bg-gray-900 transition-transform duration-700 ease-in-out ${
              isTransitioning ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ transformOrigin: "right" }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        </div>

        <div className="absolute left-8 top-1/2 -translate-y-1/2 w-64 h-80 z-5">
          <div className="relative w-full h-full overflow-hidden shadow-2xl">
            <img
              key={`secondary-${currentIndex}`}
              src={secondaryImage || "/placeholder.svg"}
              alt={`${currentSalon.nombre} - Vista secundaria`}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Curtain transition for left image - left to right */}
            <div
              className={`absolute inset-0 bg-gray-900 transition-transform duration-700 ease-in-out ${
                isTransitioning ? "translate-x-0" : "translate-x-full"
              }`}
              style={{ transformOrigin: "right" }}
            />

            <div className="absolute inset-0 bg-black/10" />
          </div>
        </div>

        {/* Content overlay - right aligned text */}
        <div className="relative h-full flex flex-col items-end justify-center text-white pr-20 z-20 w-full">
          <div key={animationKey} className="text-slide-animation max-w-2xl">
            <h2 className="text-7xl md:text-8xl font-bold mb-2 tracking-tight text-right leading-none">
              {currentSalon.nombre}
            </h2>
            <p className="text-lg md:text-xl tracking-widest mb-12 text-white/90 text-right">
              {currentSalon.descripcion || "Espacio para eventos especiales"}
            </p>

            <div className="flex justify-end">
              <Link href="/landing/landingsalones">
                <button className="group/btn relative px-10 py-4 border-2 border-white text-white font-semibold tracking-wider text-lg transition-all duration-300 hover:bg-white hover:text-gray-900 overflow-hidden">
                  <span className="relative z-10">Ver Salón</span>
                  <div className="absolute inset-0 bg-white transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-300 origin-left -z-0" />
                </button>
              </Link>
            </div>
          </div>

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

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          disabled={isTransitioning}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 z-40 disabled:opacity-50"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
        <button
          onClick={nextSlide}
          disabled={isTransitioning}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all duration-300 z-40 disabled:opacity-50"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 right-8 flex gap-2 z-40">
          {salones.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning && index !== currentIndex) {
                  setIsTransitioning(true)
                  setTimeout(() => {
                    setCurrentIndex(index)
                    setIsTransitioning(false)
                  }, 600)
                }
              }}
              disabled={isTransitioning}
              className={`h-2 transition-all duration-300 ${
                index === currentIndex ? "w-12 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Ir al salón ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  )
}
