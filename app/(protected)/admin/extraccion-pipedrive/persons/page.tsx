"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Play, Square, Search, RefreshCw, Database, Cloud } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  extraerLotePersons,
  obtenerPersonsSupabase,
  conteoPersonsSupabase,
  verificarPipedrive,
} from "@/app/actions/pipedrive"
import type { PersonRow } from "@/app/actions/pipedrive"

export default function PersonsPage() {
  const router = useRouter()
  const cancelRef = useRef(false)

  // Estado tabla
  const [persons, setPersons] = useState<PersonRow[]>([])
  const [totalPersons, setTotalPersons] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState("")
  const [loadingTabla, setLoadingTabla] = useState(true)
  const porPagina = 20

  // Estado extracción
  const [extrayendo, setExtrayendo] = useState(false)
  const [progreso, setProgreso] = useState({ insertados: 0, omitidos: 0, errores: 0, procesados: 0, loteActual: 0 })
  const [conteoSupabase, setConteoSupabase] = useState(0)
  const [pipedriveConectado, setPipedriveConectado] = useState<boolean | null>(null)
  const [loadingConteos, setLoadingConteos] = useState(true)

  // Cargar tabla
  const cargarTabla = useCallback(async () => {
    setLoadingTabla(true)
    const result = await obtenerPersonsSupabase(pagina, porPagina, busqueda)
    setPersons(result.data)
    setTotalPersons(result.total)
    setLoadingTabla(false)
  }, [pagina, busqueda])

  // Cargar conteos iniciales
  const cargarConteos = useCallback(async () => {
    setLoadingConteos(true)
    const [supa, pipe] = await Promise.all([
      conteoPersonsSupabase(),
      verificarPipedrive(),
    ])
    setConteoSupabase(supa)
    setPipedriveConectado(pipe.conectado)
    setLoadingConteos(false)
  }, [])

  useEffect(() => {
    cargarTabla()
  }, [cargarTabla])

  useEffect(() => {
    cargarConteos()
  }, [cargarConteos])

  // Extraer email primario
  function emailPrimario(emailArr: any): string {
    if (!emailArr || !Array.isArray(emailArr)) return "—"
    const primary = emailArr.find((e: any) => e.primary) || emailArr[0]
    return primary?.value || "—"
  }

  // Extraer teléfono primario
  function telefonoPrimario(telArr: any): string {
    if (!telArr || !Array.isArray(telArr)) return "—"
    const primary = telArr.find((t: any) => t.primary) || telArr[0]
    return primary?.value || "—"
  }

  // Iniciar extracción por lotes
  async function iniciarExtraccion() {
    cancelRef.current = false
    setExtrayendo(true)
    setProgreso({ insertados: 0, omitidos: 0, errores: 0, procesados: 0, loteActual: 0 })

    try {
      let start = 0
      let lote = 0
      let totalInsertados = 0
      let totalOmitidos = 0
      let totalErrores = 0
      let totalProcesados = 0

      while (true) {
        // Verificar si se pidió detener
        if (cancelRef.current) {
          toast.info(`Extracción detenida. ${totalInsertados} insertados, ${totalOmitidos} omitidos.`)
          break
        }

        lote++
        setProgreso(prev => ({ ...prev, loteActual: lote }))

        // Pausa para que React procese el click de Detener
        await new Promise(r => setTimeout(r, 50))
        if (cancelRef.current) {
          toast.info(`Extracción detenida. ${totalInsertados} insertados, ${totalOmitidos} omitidos.`)
          break
        }

        const resultado = await extraerLotePersons(start)

        if (!resultado.success) {
          toast.error(resultado.mensaje)
          break
        }

        if (resultado.total_lote === 0 && !resultado.hay_mas) {
          toast.success("No hay personas para extraer desde Pipedrive.")
          break
        }

        totalInsertados += resultado.insertados
        totalOmitidos += resultado.omitidos
        totalErrores += resultado.errores
        totalProcesados += resultado.total_lote

        setProgreso({
          insertados: totalInsertados,
          omitidos: totalOmitidos,
          errores: totalErrores,
          procesados: totalProcesados,
          loteActual: lote,
        })

        if (!resultado.hay_mas) {
          toast.success(`Extracción completada. ${totalInsertados} insertados, ${totalOmitidos} ya existían, ${totalErrores} errores.`)
          break
        }

        start = resultado.next_start
      }
    } catch (error: any) {
      toast.error(`Error inesperado: ${error.message}`)
    }

    setExtrayendo(false)
    cargarConteos()
    cargarTabla()
  }

  // Detener extracción
  function detenerExtraccion() {
    cancelRef.current = true
    toast.info("Deteniendo... esperando a que termine el lote actual.")
  }

  // Paginación
  const totalPaginas = Math.ceil(totalPersons / porPagina)

  function handleBuscar() {
    setPagina(1)
    cargarTabla()
  }

  // Sin total exacto de Pipedrive, mostramos progreso incremental
  const porcentajeProgreso = extrayendo ? Math.min(progreso.loteActual * 2, 95) : (progreso.procesados > 0 ? 100 : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin/extraccion-pipedrive")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Persons</h1>
          <p className="text-muted-foreground mt-1">Extracción de contactos desde Pipedrive</p>
        </div>
      </div>

      {/* Conteos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Cloud className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pipedrive API</p>
              <p className="text-2xl font-bold">
                {loadingConteos ? "..." : (pipedriveConectado ? "Conectado" : "Error")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-emerald-500/10 p-3">
              <Database className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Persons en Supabase</p>
              <p className="text-2xl font-bold">
                {loadingConteos ? "..." : conteoSupabase}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección Extracción */}
      <Card>
        <CardHeader>
          <CardTitle>Extracción desde Pipedrive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {!extrayendo ? (
              <Button onClick={iniciarExtraccion} className="gap-2">
                <Play className="h-4 w-4" />
                Iniciar Extracción
              </Button>
            ) : (
              <Button onClick={detenerExtraccion} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" />
                Detener
              </Button>
            )}
            {!extrayendo && conteoSupabase > 0 && (
              <p className="text-sm text-muted-foreground">
                Se omitirán los {conteoSupabase} registros que ya existen en Supabase
              </p>
            )}
          </div>

          {/* Progreso */}
          {(extrayendo || progreso.procesados > 0) && (
            <div className="space-y-3">
              <Progress value={porcentajeProgreso} />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Procesados</p>
                  <p className="font-semibold">{progreso.procesados.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Insertados</p>
                  <p className="font-semibold text-emerald-600">{progreso.insertados}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Omitidos</p>
                  <p className="font-semibold text-amber-600">{progreso.omitidos}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Errores</p>
                  <p className="font-semibold text-red-600">{progreso.errores}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lote</p>
                  <p className="font-semibold">{progreso.loteActual}</p>
                </div>
              </div>
              {extrayendo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
                  Procesando lote {progreso.loteActual}...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Persons */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Persons en Supabase</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nombre u organización..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                className="w-64"
              />
              <Button variant="outline" size="icon" onClick={handleBuscar}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={cargarTabla}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTabla ? (
            <div className="flex items-center justify-center text-muted-foreground py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mr-3" />
              Cargando...
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="w-16">ID PD</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Puesto</TableHead>
                      <TableHead>Organización</TableHead>
                      <TableHead>Propietario</TableHead>
                      <TableHead>Estatus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {persons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                          No hay personas registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      persons.map((person) => (
                        <TableRow key={person.id} className="border-border/50">
                          <TableCell className="text-sm text-muted-foreground">{person.pipedrive_id}</TableCell>
                          <TableCell className="font-medium">{person.nombre || "—"}</TableCell>
                          <TableCell className="text-sm">{emailPrimario(person.email)}</TableCell>
                          <TableCell className="text-sm">{telefonoPrimario(person.telefono)}</TableCell>
                          <TableCell className="text-sm">{person.puesto || "—"}</TableCell>
                          <TableCell className="text-sm">{person.organizacion_nombre || "—"}</TableCell>
                          <TableCell className="text-sm">{person.propietario_nombre || "—"}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                person.activo
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                              }`}
                            >
                              {person.activo ? "Activo" : "Inactivo"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((pagina - 1) * porPagina) + 1}-{Math.min(pagina * porPagina, totalPersons)} de {totalPersons}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagina <= 1}
                      onClick={() => setPagina(pagina - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm px-2">
                      {pagina} / {totalPaginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagina >= totalPaginas}
                      onClick={() => setPagina(pagina + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
