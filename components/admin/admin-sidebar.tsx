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
  Target,
  Kanban,
  ClipboardList,
  ChevronDown,
} from "lucide-react"
import { eliminarSesionCookies } from "@/app/actions/session"
import { Button } from "@/components/ui/button"

// Navigation items — main section
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
    title: "Categorias",
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
    title: "Menus",
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
    title: "Configuracion",
    href: "/configuraciones",
    icon: Settings,
  },
]

// CRM section — sub-navigation
const crmItems = [
  {
    title: "Dashboard CRM",
    href: "/crm",
    icon: Target,
  },
  {
    title: "Pipeline",
    href: "/crm/pipeline",
    icon: Kanban,
  },
  {
    title: "Actividades",
    href: "/crm/actividades",
    icon: ClipboardList,
  },
]

const quickAccessItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "CRM",
    href: "/crm",
    icon: Target,
  },
  {
    title: "Salones",
    href: "/salones",
    icon: Building2,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false)
  const [isCRMExpanded, setIsCRMExpanded] = useState(pathname?.startsWith("/crm") || false)

  const handleLogout = async () => {
    await eliminarSesionCookies()
    router.push("/auth/login")
  }

  return (
    <>
      {/* Collapsed sidebar — dark background with SPARK green accents */}
      <aside className="fixed left-0 top-0 w-[100px] h-screen border-r border-sidebar-border bg-sidebar flex flex-col z-40">
        {/* Logo section */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border flex-shrink-0">
          <img src="/logo-milenium.png" alt="Milenium" className="h-9 w-auto" />
        </div>

        {/* Quick access icons */}
        <nav className="flex-1 space-y-2 p-2 overflow-y-auto">
          {/* Hamburger menu button */}
          <button
            onClick={() => setIsOffcanvasOpen(true)}
            className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-sidebar-foreground/60 transition-all duration-200 hover:bg-white/5 hover:text-sidebar-foreground"
          >
            <Menu className="h-6 w-6" />
            <span className="text-[10px]">Menu</span>
          </button>

          {/* Quick access items */}
          {quickAccessItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-lg p-2 transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground spark-sidebar-active"
                    : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] text-center leading-tight">{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout button at bottom */}
        <div className="border-t border-sidebar-border p-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-sidebar-foreground/60 transition-all duration-200 hover:bg-white/5 hover:text-destructive"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-[10px] text-center leading-tight">Salir</span>
          </button>
        </div>
      </aside>

      {isOffcanvasOpen && <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOffcanvasOpen(false)} />}

      {/* Expanded offcanvas sidebar — same dark SPARK theme */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-300 flex flex-col",
          isOffcanvasOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header with SPARK logo and close button */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5 flex-shrink-0">
          <img src="/logo-milenium.png" alt="Milenium" className="h-7 w-auto" />
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setIsOffcanvasOpen(false)}>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium spark-sidebar-active"
                    : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}

          {/* CRM Section — collapsible */}
          <div className="pt-3 mt-3 border-t border-sidebar-border">
            <button
              onClick={() => setIsCRMExpanded(!isCRMExpanded)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200",
                pathname?.startsWith("/crm")
                  ? "text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4" />
                CRM
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                isCRMExpanded ? "rotate-180" : "",
              )} />
            </button>

            {isCRMExpanded && (
              <div className="ml-4 space-y-1 mt-1">
                {crmItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOffcanvasOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium spark-sidebar-active"
                          : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  )
}
