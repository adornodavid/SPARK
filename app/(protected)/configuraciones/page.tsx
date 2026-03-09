"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Building2, Settings, Palette } from "lucide-react"
import {
  obtenerConfiguracion,
  obtenerUsuariosConfig,
  obtenerHotelesConfig,
  obtenerRoles,
} from "@/app/actions/configuraciones"
import { UsersManagement } from "@/components/admin/settings/users-management"
import { HotelsManagement } from "@/components/admin/settings/hotels-management"
import { GeneralSettings } from "@/components/admin/settings/general-settings"
import { SystemPreferences } from "@/components/admin/settings/system-preferences"

export default function ConfiguracionesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("usuarios")

  // Data states
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [hoteles, setHoteles] = useState<any[]>([])
  const [roles, setRoles] = useState<Array<{ id: number; nombre: string }>>([])
  const [config, setConfig] = useState<Record<string, string>>({})

  const cargarDatos = useCallback(async () => {
    try {
      const [configRes, usuariosRes, hotelesRes, rolesRes] = await Promise.all([
        obtenerConfiguracion(),
        obtenerUsuariosConfig(),
        obtenerHotelesConfig(),
        obtenerRoles(),
      ])

      if (configRes.success && configRes.data) {
        setConfig(configRes.data)
      }
      if (usuariosRes.success && usuariosRes.data) {
        setUsuarios(usuariosRes.data)
      }
      if (hotelesRes.success && hotelesRes.data) {
        setHoteles(hotelesRes.data)
      }
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data)
      }
    } catch (error) {
      console.error("Error cargando datos de configuracion:", error)
    }
  }, [])

  useEffect(() => {
    async function init() {
      const session = await obtenerSesion()
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }
      // Solo admin principal (1) y admin general (2)
      const allowedRoles = [1, 2]
      if (!allowedRoles.includes(Number(session.RolId))) {
        router.push("/dashboard")
        return
      }
      await cargarDatos()
      setLoading(false)
    }
    init()
  }, [router, cargarDatos])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
          <p className="text-sm text-muted-foreground">Cargando configuraciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuraciones</h1>
        <p className="text-sm text-muted-foreground">
          Administra usuarios, hoteles y ajustes del sistema SPARK
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="hoteles" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Hoteles</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferencias</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-6">
          <UsersManagement
            usuarios={usuarios}
            roles={roles}
            hoteles={hoteles}
            onRefresh={cargarDatos}
          />
        </TabsContent>

        <TabsContent value="hoteles" className="space-y-6">
          <HotelsManagement
            hoteles={hoteles}
            onRefresh={cargarDatos}
          />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings
            config={config}
            onRefresh={cargarDatos}
          />
        </TabsContent>

        <TabsContent value="preferencias" className="space-y-6">
          <SystemPreferences
            config={config}
            hoteles={hoteles}
            onRefresh={cargarDatos}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
