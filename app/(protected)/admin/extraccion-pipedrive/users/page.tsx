"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Play, Square, Search, RefreshCw, Database, Cloud } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { ErrorDetalle, UserRow } from "@/app/actions/pipedrive"
import {
  extraerLoteUsers,
  obtenerUsersSupabase,
  conteoUsersSupabase,
  conteoPipedriveUsers,
  verificarPipedriveUsers,
} from "@/app/actions/pipedrive"

export default function UsersPage() {
  const router = useRouter()
  const cancelRef = useRef(false)

  const [items, setItems] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState("")
  const [loadingTabla, setLoadingTabla] = useState(true)
  const porPagina = 20

  const [extrayendo, setExtrayendo] = useState(false)
  const [progreso, setProgreso] = useState({ insertados: 0, omitidos: 0, errores: 0, procesados: 0, loteActual: 0 })
  const [conteoSupabase, setConteoSupabase] = useState(0)
  const [pipedriveConectado, setPipedriveConectado] = useState<boolean | null>(null)
  const [conteoPipe, setConteoPipe] = useState<number | null>(null)
  const [loadingConteoPipe, setLoadingConteoPipe] = useState(false)
  const [loadingConteos, setLoadingConteos] = useState(true)
  const [modoCompleto, setModoCompleto] = useState(false)
  const [erroresDetalle, setErroresDetalle] = useState<ErrorDetalle[]>([])

  const cargarTabla = useCallback(async () => {
    setLoadingTabla(true)
    const result = await obtenerUsersSupabase(pagina, porPagina, busqueda)
    setItems(result.data)
    setTotal(result.total)
    setLoadingTabla(false)
  }, [pagina, busqueda])

  const cargarConteos = useCallback(async () => {
    setLoadingConteos(true)
    const [supa, pipe] = await Promise.all([
      conteoUsersSupabase(),
      verificarPipedriveUsers(),
    ])
    setConteoSupabase(supa)
    setPipedriveConectado(pipe.conectado)
    setLoadingConteos(false)
  }, [])

  async function validarConteoPipedrive() {
    setLoadingConteoPipe(true)
    const t = await conteoPipedriveUsers()
    setConteoPipe(t)
    setLoadingConteoPipe(false)
  }

  useEffect(() => { cargarTabla() }, [cargarTabla])
  useEffect(() => { cargarConteos() }, [cargarConteos])

  async function iniciarExtraccion() {
    cancelRef.current = false
    setExtrayendo(true)
    setProgreso({ insertados: 0, omitidos: 0, errores: 0, procesados: 0, loteActual: 0 })
    setErroresDetalle([])

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

        const resultado = await extraerLoteUsers(start)
        if (!resultado.success) { toast.error(resultado.mensaje); break }
        if (resultado.total_lote === 0 && !resultado.hay_mas) {
          toast.success("No hay users para extraer desde Pipedrive.")
          break
        }

        totalInsertados += resultado.insertados
        totalOmitidos += resultado.omitidos
        totalErrores += resultado.errores
        totalProcesados += resultado.total_lote

        if (resultado.erroresDetalle.length > 0) {
          setErroresDetalle(prev => [...prev, ...resultado.erroresDetalle])
        }

        if (!modoCompleto && resultado.insertados === 0 && resultado.omitidos === resultado.total_lote) {
          toast.success(`Extracción completada. ${totalInsertados} nuevos insertados.`)
          break
        }

        setProgreso({ insertados: totalInsertados, omitidos: totalOmitidos, errores: totalErrores, procesados: totalProcesados, loteActual: lote })

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

  function detenerExtraccion() {
    cancelRef.current = true
    toast.info("Deteniendo... esperando a que termine el lote actual.")
  }

  const totalPaginas = Math.ceil(total / porPagina)
  function handleBuscar() { setPagina(1); cargarTabla() }
  const porcentajeProgreso = extrayendo ? Math.min(progreso.loteActual * 2, 95) : (progreso.procesados > 0 ? 100 : 0)

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin/extraccion-pipedrive")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Extracción de usuarios del CRM desde Pipedrive</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="w-fit">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-blue-500/10 p-3 shrink-0"><Cloud className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Pipedrive API</p>
              <p className="text-2xl font-bold">{loadingConteos ? "..." : (pipedriveConectado ? "Conectado" : "Error")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="w-fit">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-blue-500/10 p-3 shrink-0"><Cloud className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Users en Pipedrive</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{loadingConteoPipe ? "..." : (conteoPipe !== null ? conteoPipe.toLocaleString() : "0")}</p>
                {conteoPipe === null && !loadingConteoPipe && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={validarConteoPipedrive}>Validar</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-fit">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-emerald-500/10 p-3 shrink-0"><Database className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Users en Supabase</p>
              <p className="text-2xl font-bold">{loadingConteos ? "..." : conteoSupabase.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-fit">
        <CardHeader><CardTitle>Extracción desde Pipedrive</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Checkbox id="modo-rapido" checked={!modoCompleto} onCheckedChange={() => setModoCompleto(false)} disabled={extrayendo} />
                <Label htmlFor="modo-rapido" className="text-sm font-normal cursor-pointer">Solo nuevos (corta al no encontrar nuevos)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="modo-completo" checked={modoCompleto} onCheckedChange={() => setModoCompleto(true)} disabled={extrayendo} />
                <Label htmlFor="modo-completo" className="text-sm font-normal cursor-pointer">Recorrido completo</Label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!extrayendo ? (
                <Button onClick={iniciarExtraccion} className="gap-2"><Play className="h-4 w-4" />Iniciar Extracción</Button>
              ) : (
                <Button onClick={detenerExtraccion} variant="destructive" className="gap-2"><Square className="h-4 w-4" />Detener</Button>
              )}
              {!extrayendo && conteoSupabase > 0 && (
                <p className="text-sm text-muted-foreground">Se omitirán los {conteoSupabase} registros que ya existen en Supabase</p>
              )}
            </div>
          </div>

          {(extrayendo || progreso.procesados > 0) && (
            <div className="space-y-3">
              <Progress value={porcentajeProgreso} />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div><p className="text-muted-foreground">Procesados</p><p className="font-semibold">{progreso.procesados.toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Insertados</p><p className="font-semibold text-emerald-600">{progreso.insertados}</p></div>
                <div><p className="text-muted-foreground">Omitidos</p><p className="font-semibold text-amber-600">{progreso.omitidos}</p></div>
                <div><p className="text-muted-foreground">Errores</p><p className="font-semibold text-red-600">{progreso.errores}</p></div>
                <div><p className="text-muted-foreground">Lote</p><p className="font-semibold">{progreso.loteActual}</p></div>
              </div>
              {extrayendo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
                  Procesando lote {progreso.loteActual}...
                </div>
              )}
            </div>
          )}

          {erroresDetalle.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/30 dark:border-red-800 space-y-2">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Errores ({erroresDetalle.length})</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {erroresDetalle.map((err, i) => (
                  <div key={i} className="text-xs text-red-600 dark:text-red-400 font-mono bg-white dark:bg-red-950/50 rounded px-2 py-1">
                    <span className="font-semibold">PD #{err.pipedrive_id}</span>
                    {err.nombre && <span> — {err.nombre}</span>}
                    <span className="text-red-400 dark:text-red-500"> → {err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Users en Supabase</CardTitle>
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleBuscar()} className="w-64" />
              <Button variant="outline" size="icon" onClick={handleBuscar}><Search className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={cargarTabla}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTabla ? (
            <div className="flex items-center justify-center text-muted-foreground py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mr-3" />Cargando...
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border/50 overflow-x-auto">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="w-14">Id</TableHead>
                      <TableHead className="w-14">Pd</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead className="w-20">Rol</TableHead>
                      <TableHead className="w-20">Admin</TableHead>
                      <TableHead className="w-20">Estatus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">No hay users registrados</TableCell></TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id} className="border-border/50">
                          <TableCell className="text-sm text-muted-foreground">{item.id}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.pipedrive_id}</TableCell>
                          <TableCell className="font-medium truncate">{item.nombre || "—"}</TableCell>
                          <TableCell className="text-sm truncate">{item.email || "—"}</TableCell>
                          <TableCell className="text-sm truncate">{item.telefono || "—"}</TableCell>
                          <TableCell className="text-sm">{item.rol_id || "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              item.admin
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
                                : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800"
                            }`}>{item.admin ? "Sí" : "No"}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              item.activo
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                            }`}>{item.activo ? "Activo" : "Inactivo"}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((pagina - 1) * porPagina) + 1}-{Math.min(pagina * porPagina, total)} de {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
                    <span className="text-sm px-2">{pagina} / {totalPaginas}</span>
                    <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
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
