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
  extraerLoteTasks,
  obtenerTasksSupabase,
  conteoTasksSupabase,
  verificarPipedriveTasks,
} from "@/app/actions/pipedrive"
import type { TaskRow } from "@/app/actions/pipedrive"

export default function TasksPage() {
  const router = useRouter()
  const cancelRef = useRef(false)

  // Estado tabla
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [totalTasks, setTotalTasks] = useState(0)
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
    const result = await obtenerTasksSupabase(pagina, porPagina, busqueda)
    setTasks(result.data)
    setTotalTasks(result.total)
    setLoadingTabla(false)
  }, [pagina, busqueda])

  // Cargar conteos iniciales
  const cargarConteos = useCallback(async () => {
    setLoadingConteos(true)
    const [supa, pipe] = await Promise.all([
      conteoTasksSupabase(),
      verificarPipedriveTasks(),
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
        if (cancelRef.current) {
          toast.info(`Extracción detenida. ${totalInsertados} insertados, ${totalOmitidos} omitidos.`)
          break
        }

        lote++
        setProgreso(prev => ({ ...prev, loteActual: lote }))

        await new Promise(r => setTimeout(r, 50))
        if (cancelRef.current) {
          toast.info(`Extracción detenida. ${totalInsertados} insertados, ${totalOmitidos} omitidos.`)
          break
        }

        const resultado = await extraerLoteTasks(start)

        if (!resultado.success) {
          toast.error(resultado.mensaje)
          break
        }

        if (resultado.total_lote === 0 && !resultado.hay_mas) {
          toast.success("No hay tareas para extraer desde Pipedrive.")
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
  const totalPaginas = Math.ceil(totalTasks / porPagina)

  function handleBuscar() {
    setPagina(1)
    cargarTabla()
  }

  const porcentajeProgreso = extrayendo ? Math.min(progreso.loteActual * 2, 95) : (progreso.procesados > 0 ? 100 : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin/extraccion-pipedrive")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Extracción de tareas desde Pipedrive</p>
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
              <p className="text-sm text-muted-foreground">Tasks en Supabase</p>
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

      {/* Tabla de Tasks */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Tasks en Supabase</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por título o descripción..."
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
                      <TableHead>Título</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Fecha Vencimiento</TableHead>
                      <TableHead className="text-center">Proyecto ID</TableHead>
                      <TableHead className="text-center">Asignado ID</TableHead>
                      <TableHead className="text-center">Creador ID</TableHead>
                      <TableHead>Estatus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                          No hay tareas registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      tasks.map((task) => (
                        <TableRow key={task.id} className="border-border/50">
                          <TableCell className="text-sm text-muted-foreground">{task.pipedrive_id}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{task.titulo || "—"}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{task.descripcion || "��"}</TableCell>
                          <TableCell className="text-sm">{task.fecha_vencimiento || "—"}</TableCell>
                          <TableCell className="text-sm text-center">{task.proyecto_id || "���"}</TableCell>
                          <TableCell className="text-sm text-center">{task.asignado_id || "—"}</TableCell>
                          <TableCell className="text-sm text-center">{task.creador_id || "—"}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                task.completado
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                              }`}
                            >
                              {task.completado ? "Completado" : "Pendiente"}
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
                    Mostrando {((pagina - 1) * porPagina) + 1}-{Math.min(pagina * porPagina, totalTasks)} de {totalTasks}
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
