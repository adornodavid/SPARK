"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Users,
  FileText,
  Calendar,
  ArrowRight,
  Clock,
  Command,
  Home,
  Building2,
  BedDouble,
  Package,
  Utensils,
  Handshake,
  BarChart3,
  Settings,
  Target,
  Kanban,
  ClipboardList,
} from "lucide-react"
import { busquedaGlobal } from "@/app/actions/crm"
import type { oCommandResult } from "@/types/crm"

const navModules = [
  { title: "Inicio", href: "/dashboard", icon: Home },
  { title: "Hoteles", href: "/hoteles", icon: Building2 },
  { title: "Habitaciones", href: "/habitaciones", icon: BedDouble },
  { title: "Salones", href: "/salones", icon: Building2 },
  { title: "Paquetes", href: "/packages", icon: Package },
  { title: "Menus", href: "/menus", icon: Utensils },
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Cotizaciones", href: "/cotizaciones", icon: FileText },
  { title: "Reservaciones", href: "/reservaciones", icon: Calendar },
  { title: "Convenios", href: "/agreements", icon: Handshake },
  { title: "Reportes", href: "/reportes", icon: BarChart3 },
  { title: "Configuracion", href: "/configuraciones", icon: Settings },
  { title: "Dashboard CRM", href: "/crm", icon: Target },
  { title: "Pipeline", href: "/crm/pipeline", icon: Kanban },
  { title: "Actividades", href: "/crm/actividades", icon: ClipboardList },
]

const resultIcons: Record<string, any> = {
  Users,
  FileText,
  Calendar,
}

const resultColors: Record<string, string> = {
  cliente: "text-blue-600",
  cotizacion: "text-primary",
  reservacion: "text-emerald-600",
}

const resultLabels: Record<string, string> = {
  cliente: "Cliente",
  cotizacion: "Cotizacion",
  reservacion: "Reservacion",
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<oCommandResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<oCommandResult[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("spark-recent-searches")
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const result = await busquedaGlobal(query)
      if (result.success && result.data) {
        setResults(result.data)
        setSelectedIndex(0)
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentFilteredModules = query.length >= 1
      ? navModules.filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
      : navModules
    const displayResults = query.length >= 2 ? results : recentSearches
    const totalItems = currentFilteredModules.length + displayResults.length
    const maxIndex = totalItems - 1

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, maxIndex))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const idx = selectedIndex
      if (idx < currentFilteredModules.length) {
        router.push(currentFilteredModules[idx].href)
        onOpenChange(false)
      } else {
        const resultIdx = idx - currentFilteredModules.length
        if (displayResults[resultIdx]) {
          navigateToResult(displayResults[resultIdx])
        }
      }
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }, [results, recentSearches, selectedIndex, query, router, onOpenChange])

  function navigateToResult(result: oCommandResult) {
    // Save to recent searches
    const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5)
    setRecentSearches(updated)
    try {
      localStorage.setItem("spark-recent-searches", JSON.stringify(updated))
    } catch {
      // ignore
    }

    router.push(result.url)
    onOpenChange(false)
  }

  // Filter nav modules by query
  const filteredModules = query.length >= 1
    ? navModules.filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
    : navModules

  const displayResults = query.length >= 2 ? results : recentSearches
  const showRecent = query.length < 2 && recentSearches.length > 0

  // Group results by type
  const grouped: Record<string, oCommandResult[]> = {}
  displayResults.forEach(r => {
    if (!grouped[r.tipo]) grouped[r.tipo] = []
    grouped[r.tipo].push(r)
  })

  let globalIndex = 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Buscar</DialogTitle>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border/50">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar clientes, cotizaciones, reservaciones..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-14 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          )}
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border/50 bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Navigation modules */}
          {filteredModules.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
                  Modulos
                </p>
              </div>
              {filteredModules.map((mod) => {
                const currentIndex = globalIndex++
                const isSelected = currentIndex === selectedIndex
                const ModIcon = mod.icon
                return (
                  <button
                    key={mod.href}
                    onClick={() => { router.push(mod.href); onOpenChange(false) }}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                      isSelected ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-card border border-border/50 flex items-center justify-center">
                      <ModIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{mod.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{mod.href}</p>
                    </div>
                    {isSelected && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </>
          )}

          {showRecent && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
                Busquedas recientes
              </p>
            </div>
          )}

          {query.length >= 2 && results.length === 0 && filteredModules.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Sin resultados para "{query}"</p>
            </div>
          )}

          {Object.entries(grouped).map(([tipo, items]) => (
            <div key={tipo}>
              {query.length >= 2 && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
                    {resultLabels[tipo] || tipo}s
                  </p>
                </div>
              )}
              {items.map((result) => {
                const currentIndex = globalIndex++
                const isSelected = currentIndex === selectedIndex
                const IconComp = resultIcons[result.icono] || FileText
                const color = resultColors[result.tipo] || "text-muted-foreground"

                return (
                  <button
                    key={result.id}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                      isSelected ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className={`flex-shrink-0 h-9 w-9 rounded-lg bg-card border border-border/50 flex items-center justify-center`}>
                      <IconComp className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.subtitulo}</p>
                    </div>
                    {isSelected && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center rounded border border-border/50 bg-card px-1 text-[10px]">↑↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center rounded border border-border/50 bg-card px-1 text-[10px]">↵</kbd>
              Abrir
            </span>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Command className="h-3 w-3" />K para buscar
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
