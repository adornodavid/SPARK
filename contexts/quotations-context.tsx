"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Quotation {
  id: string
  salonNombre: string
  hotelNombre: string
  direccion: string
  fecha: Date
  hotelId: string
  salonId: string
}

interface QuotationsContextType {
  quotations: Quotation[]
  addQuotation: (quotation: Omit<Quotation, "id" | "fecha">) => void
  removeQuotation: (id: string) => void
  clearQuotations: () => void
}

const QuotationsContext = createContext<QuotationsContextType | undefined>(undefined)

export function QuotationsProvider({ children }: { children: ReactNode }) {
  const [quotations, setQuotations] = useState<Quotation[]>([])

  const addQuotation = (quotation: Omit<Quotation, "id" | "fecha">) => {
    const newQuotation: Quotation = {
      ...quotation,
      id: Math.random().toString(36).substring(7),
      fecha: new Date(),
    }
    setQuotations((prev) => [...prev, newQuotation])
  }

  const removeQuotation = (id: string) => {
    setQuotations((prev) => prev.filter((q) => q.id !== id))
  }

  const clearQuotations = () => {
    setQuotations([])
  }

  return (
    <QuotationsContext.Provider
      value={{
        quotations,
        addQuotation,
        removeQuotation,
        clearQuotations,
      }}
    >
      {children}
    </QuotationsContext.Provider>
  )
}

export function useQuotations() {
  const context = useContext(QuotationsContext)
  if (context === undefined) {
    throw new Error("useQuotations must be used within a QuotationsProvider")
  }
  return context
}
