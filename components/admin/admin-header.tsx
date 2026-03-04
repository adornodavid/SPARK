"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User, FileText, X, MapPin, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { eliminarSesionCookies } from "@/app/actions/session"
import { useQuotations } from "@/contexts/quotations-context"
import { useState } from "react"

interface AdminHeaderProps {
  user: {
    UsuarioId: string
    Email: string
    NombreCompleto: string
    Rol: string
    SesionActiva: boolean
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const { quotations, removeQuotation, clearQuotations } = useQuotations()
  const [showQuotationsPanel, setShowQuotationsPanel] = useState(false)

  const handleSignOut = async () => {
    await eliminarSesionCookies()
    router.push("/auth/login")
  }

  const getInitials = (nombreCompleto: string) => {
    const parts = nombreCompleto.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return nombreCompleto.substring(0, 2).toUpperCase()
  }

  const initials = getInitials(user.NombreCompleto)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex-1" />

      <div className="relative mr-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-accent transition-all hover:scale-110"
          onClick={() => setShowQuotationsPanel(!showQuotationsPanel)}
        >
          <FileText className="h-5 w-5 text-foreground" />
          {quotations.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-semibold animate-pulse">
              {quotations.length}
            </span>
          )}
        </Button>

        {/* Quotations Panel */}
        {showQuotationsPanel && (
          <div className="absolute right-0 top-14 w-96 bg-background border rounded-lg shadow-2xl z-50 max-h-[500px] overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h3 className="font-semibold">Cotizaciones ({quotations.length})</h3>
              </div>
              <div className="flex gap-2">
                {quotations.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-white hover:bg-white/20"
                    onClick={clearQuotations}
                  >
                    Limpiar Todo
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={() => setShowQuotationsPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[400px] p-2">
              {quotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">No hay cotizaciones aún</p>
                  <p className="text-xs mt-1">Cotiza un salón para comenzar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quotations.map((quotation) => (
                    <div
                      key={quotation.id}
                      className="group bg-muted/50 hover:bg-muted rounded-lg p-3 transition-all border border-transparent hover:border-orange-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{quotation.salonNombre}</h4>
                          <p className="text-xs text-muted-foreground truncate mt-1">{quotation.hotelNombre}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{quotation.direccion}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {quotation.fecha.toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeQuotation(quotation.id)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {quotations.length > 0 && (
              <div className="sticky bottom-0 p-3 bg-background border-t">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  onClick={() => {
                    // Get the first quotation to prefill form
                    const firstQuotation = quotations[0]
                    router.push(`/cotizaciones/new?hotelId=${firstQuotation.hotelId}&salonId=${firstQuotation.salonId}`)
                    setShowQuotationsPanel(false)
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Cotización
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.NombreCompleto}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.Email}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.Rol}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
