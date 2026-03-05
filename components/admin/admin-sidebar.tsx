"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Building2,
  BedDouble,
  Users,
  FileText,
  Calendar,
  Handshake,
  BarChart3,
  Settings,
  Home,
  Utensils,
  Package,
  Layers,
  Menu,
  LogOut,
  X,
  ClipboardList,
} from "lucide-react"
import { eliminarSesionCookies } from "@/app/actions/session"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Hoteles",
    href: "/hoteles",
    icon: Building2,
  },
  {
    title: "Categorías",
    href: "/room-categories",
    icon: Layers,
  },
  {
    title: "Habitaciones",
    href: "/habitaciones",
    icon: BedDouble,
  },
  {
    title: "Salones",
    href: "/salones",
    icon: Building2,
  },
  {
    title: "Paquetes",
    href: "/packages",
    icon: Package,
  },
  {
    title: "Menús",
    href: "/menus",
    icon: Utensils,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Cotizaciones",
    href: "/cotizaciones",
    icon: FileText,
  },
  {
    title: "Reservaciones",
    href: "/reservaciones",
    icon: Calendar,
  },
  {
    title: "Convenios",
    href: "/agreements",
    icon: Handshake,
  },
  {
    title: "Reportes",
    href: "/reportes",
    icon: BarChart3,
  },
  {
    title: "Configuración",
    href: "/configuraciones",
    icon: Settings,
  },
]

const quickAccessItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Salones",
    href: "/salones",
    icon: Building2,
  },
  {
    title: "Habitaciones",
    href: "/habitaciones",
    icon: BedDouble,
  },
  {
    title: "Cotizaciones",
    href: "/cotizaciones",
    icon: ClipboardList,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false)

  const handleLogout = async () => {
    await eliminarSesionCookies()
    router.push("/auth/login")
  }

  return (
    <>
      <aside className="fixed left-0 top-0 w-[100px] h-screen border-r bg-background flex flex-col z-40">
        {/* Logo section */}
        <div className="flex h-16 items-center justify-center border-b flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            PM
          </div>
        </div>

        {/* Quick access icons */}
        <nav className="flex-1 space-y-2 p-2 overflow-y-auto">
          {/* Hamburger menu button */}
          <button
            onClick={() => setIsOffcanvasOpen(true)}
            className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
            <span className="text-[10px]">Menú</span>
          </button>

          {/* Quick access items */}
          {quickAccessItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-lg p-2 transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] text-center leading-tight">{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout button at bottom */}
        <div className="border-t p-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-[10px] text-center leading-tight">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {isOffcanvasOpen && <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOffcanvasOpen(false)} />}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-300 flex flex-col",
          isOffcanvasOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header with close button */}
        <div className="flex h-16 items-center justify-between border-b px-6 flex-shrink-0">
          <h1 className="text-lg font-semibold">Portal Milenium</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsOffcanvasOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Full navigation menu */}
        <nav className="space-y-1 p-4 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOffcanvasOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
