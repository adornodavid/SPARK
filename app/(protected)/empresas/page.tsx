"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Plus, Download, RefreshCw, Loader2, Search, X, Eye, Edit, ChevronLeft, ChevronRight, Square, Info } from "lucide-react"
import Link from "next/link"
import {
  transferirNuevasEmpresasDesdePipedrive,
  listarEmpresasPaginado,
} from "@/app/actions/empresas"
import { extraerLoteOrganizations } from "@/app/actions/pipedrive"
import type { ErrorDetalle } from "@/app/actions/pipedrive"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type EmpresaRow = {
  id: number
  nombre: string | null
  direccion: string | null
  email: string | null
  telefono: string | null
}

const PAGE_SIZE = 50

export default function EmpresasPage() {
  const router = useRouter()
  const cancelRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [rolId, setRolId] = useState(0)
  const [importing, setImporting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "error"; msg: string } | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [searchActive, setSearchActive] = useState("")
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<EmpresaRow[]>([])
  const [total, setTotal] = useState(0)
  const [fetching, setFetching] = useState(false)

  const [progreso, setProgreso] = useState({ insertados: 0, omitidos: 0, errores: 0, procesados: 0, loteActual: 0 })
  const [erroresDetalle, setErroresDetalle] = useState<ErrorDetalle[]>([])
  const [fase, setFase] = useState<"idle" | "extrayendo" | "transfiriendo" | "hecho">("idle")
  const [resultadoTransfer, setResultadoTransfer] = useState<{ insertados: number } | null>(null)

  async function fetchRows(s: string, p: number) {
    setFetching(true)
    const r = await listarEmpresasPaginado(s, p, PAGE_SIZE)
    setFetching(false)
    if (r.success) {
      setRows((r.data as EmpresaRow[]) || [])
      setTotal(r.total ?? 0)
    } else {
      setFeedback({ tipo: "error", msg: r.error || "Error al cargar empresas" })
    }
  }

  useEffect(() => {
    async function boot() {
      const session = await obtenerSesion()
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }
      const allowedRoles = [1, 2, 3, 4]
      const currentRol = Number(session.RolId)
      if (!allowedRoles.includes(currentRol)) {
        router.push("/dashboard")
        return
      }
      setRolId(currentRol)
      setLoading(false)
      await fetchRows("", 1)
    }
    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function onBuscar() {
    setPage(1)
    setSearchActive(searchInput)
    await fetchRows(searchInput, 1)
  }

  async function onLimpiar() {
    setSearchInput("")
    setSearchActive("")
    setPage(1)
    await fetchRows("", 1)
  }

  async function goPage(p: number) {
    setPage(p)
    await fetchRows(searchActive, p)
  }

  async function onImportarNuevos() {
    if (!confirm("¿Insertar en empresas todos los registros nuevos de pip_organizations?")) return
    setImporting(true)
    setFeedback(null)
    const r = await transferirNuevasEmpresasDesdePipedrive()
    setImporting(false)
    if (r.success) {
      setFeedback({ tipo: "ok", msg: `Insertadas: ${r.insertados}.` })
      await fetchRows(searchActive, 1)
      setPage(1)
    } else {
      setFeedback({ tipo: "error", msg: r.error || "Error desconocido" })
    }
  }

  async function onActualizarConPipedrive() {
    if (!confirm("Se extraerán nuevas organizaciones desde Pipedrive → pip_organizations, luego se insertarán en empresas. ¿Continuar?")) return
    cancelRef.current = false
    setUpdating(true)
    setFeedback(null)
    setProgreso({ insertados: 0, omitidos: 0, errores: 0, procesados: 0, loteActual: 0 })
    setErroresDetalle([])
    setResultadoTransfer(null)
    setFase("extrayendo")

    let start = 0
    let lote = 0
    let totalInsertados = 0
    let totalOmitidos = 0
    let totalErrores = 0
    let totalProcesados = 0

    try {
      while (true) {
        if (cancelRef.current) break
        lote++
        setProgreso(p => ({ ...p, loteActual: lote }))
        await new Promise(r => setTimeout(r, 30))
        if (cancelRef.current) break

        const resultado = await extraerLoteOrganizations(start)
        if (!resultado.success) {
          setFeedback({ tipo: "error", msg: resultado.mensaje })
          break
        }
        if (resultado.total_lote === 0 && !resultado.hay_mas) break

        totalInsertados += resultado.insertados
        totalOmitidos += resultado.omitidos
        totalErrores += resultado.errores
        totalProcesados += resultado.total_lote

        if (resultado.erroresDetalle.length > 0) {
          setErroresDetalle(prev => [...prev, ...resultado.erroresDetalle])
        }

        setProgreso({
          insertados: totalInsertados,
          omitidos: totalOmitidos,
          errores: totalErrores,
          procesados: totalProcesados,
          loteActual: lote,
        })

        if (resultado.insertados === 0 && resultado.omitidos === resultado.total_lote) break
        if (!resultado.hay_mas) break
        start = resultado.next_start
      }

      setFase("transfiriendo")
      const r = await transferirNuevasEmpresasDesdePipedrive()
      if (r.success) {
        setResultadoTransfer({ insertados: r.insertados ?? 0 })
        setFeedback({
          tipo: "ok",
          msg: `Pipedrive → pip_organizations: ${totalInsertados} insertadas. pip_organizations → empresas: ${r.insertados} insertadas.`,
        })
      } else {
        setFeedback({ tipo: "error", msg: r.error || "Error en transferencia a empresas" })
      }

      await fetchRows(searchActive, 1)
      setPage(1)
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Error desconocido"
      setFeedback({ tipo: "error", msg: `Error inesperado: ${m}` })
    } finally {
      setFase("hecho")
      setUpdating(false)
    }
  }

  function detenerActualizacion() {
    cancelRef.current = true
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
        <div className="h-64 w-full bg-muted animate-pulse rounded" />
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const porcentaje = fase === "extrayendo" ? Math.min(progreso.loteActual * 2, 95) : fase === "transfiriendo" ? 97 : fase === "hecho" ? 100 : 0

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu cartera de empresas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/empresas/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Empresa
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Acciones especiales</h2>
          <span className="text-xs text-muted-foreground">
            Procesos de sincronización con Pipedrive
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" onClick={onActualizarConPipedrive} disabled={importing || updating}>
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Actualizar con Pipedrive
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Información del proceso">
                  <Info className="h-4 w-4 text-blue-600" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 text-sm">
                <p className="font-semibold mb-2">Actualizar con Pipedrive</p>
                <p className="text-muted-foreground mb-2">
                  Proceso en 2 fases:
                </p>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1 mb-2">
                  <li><strong>Fase 1:</strong> consulta la API de Pipedrive en lotes y agrega a <code className="font-mono text-xs">pip_organizations</code> las organizaciones nuevas (corta al encontrar un lote completamente ya existente).</li>
                  <li><strong>Fase 2:</strong> transfiere las nuevas de <code className="font-mono text-xs">pip_organizations</code> a <code className="font-mono text-xs">empresas</code>.</li>
                </ol>
                <p className="text-muted-foreground">
                  Puedes detener el proceso en cualquier momento con el botón Detener.
                </p>
              </PopoverContent>
            </Popover>
          </div>

          {[1, 2, 3].includes(rolId) && (
            <div className="flex items-center gap-1">
              <Button variant="outline" onClick={onImportarNuevos} disabled={importing || updating}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Importar nuevos de Pipedrive
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Información del proceso">
                    <Info className="h-4 w-4 text-blue-600" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 text-sm">
                  <p className="font-semibold mb-2">Importar nuevos de Pipedrive</p>
                  <p className="text-muted-foreground mb-2">
                    Toma los registros que ya están cargados en la tabla <code className="font-mono text-xs">pip_organizations</code> (extraídos previamente desde Pipedrive) y los inserta en la tabla <code className="font-mono text-xs">empresas</code>.
                  </p>
                  <p className="text-muted-foreground">
                    Solo se insertan organizaciones nuevas (las que aún no existen en <code className="font-mono text-xs">empresas</code> según su <code className="font-mono text-xs">pipedrive_id</code>). No consulta la API de Pipedrive.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {(updating || fase === "hecho") && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              {fase === "extrayendo" && <><Loader2 className="h-4 w-4 animate-spin" /> Extrayendo desde Pipedrive → pip_organizations (lote {progreso.loteActual})</>}
              {fase === "transfiriendo" && <><Loader2 className="h-4 w-4 animate-spin" /> Transfiriendo pip_organizations → empresas</>}
              {fase === "hecho" && <>Proceso finalizado</>}
            </div>
            {updating && (
              <Button size="sm" variant="destructive" onClick={detenerActualizacion}>
                <Square className="mr-2 h-3 w-3" />
                Detener
              </Button>
            )}
          </div>
          <Progress value={porcentaje} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Procesados</p><p className="font-semibold">{progreso.procesados.toLocaleString()}</p></div>
            <div><p className="text-muted-foreground text-xs">Insertados en pip_organizations</p><p className="font-semibold text-emerald-600">{progreso.insertados}</p></div>
            <div><p className="text-muted-foreground text-xs">Omitidos (ya existían)</p><p className="font-semibold text-amber-600">{progreso.omitidos}</p></div>
            <div><p className="text-muted-foreground text-xs">Errores</p><p className="font-semibold text-red-600">{progreso.errores}</p></div>
            <div><p className="text-muted-foreground text-xs">Lote actual</p><p className="font-semibold">{progreso.loteActual}</p></div>
          </div>
          {resultadoTransfer && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="text-muted-foreground text-xs">Insertadas en empresas</p>
              <p className="font-semibold text-emerald-600">{resultadoTransfer.insertados}</p>
            </div>
          )}
          {erroresDetalle.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-red-600">Errores ({erroresDetalle.length})</summary>
              <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
                {erroresDetalle.map((err, i) => (
                  <div key={i} className="font-mono bg-red-50 text-red-700 rounded px-2 py-1">
                    PD #{err.pipedrive_id}{err.nombre ? ` — ${err.nombre}` : ""} → {err.error}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {feedback && fase !== "extrayendo" && fase !== "transfiriendo" && (
        <div className={`rounded-md border px-4 py-2 text-sm ${feedback.tipo === "ok" ? "border-green-500/40 bg-green-500/10 text-green-700" : "border-red-500/40 bg-red-500/10 text-red-700"}`}>
          {feedback.msg}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card p-3">
        <Input
          placeholder="Buscar por id, nombre, dirección, email o teléfono…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onBuscar() }}
          className="flex-1"
        />
        <Button onClick={onBuscar} disabled={fetching}>
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
        <Button variant="outline" onClick={onLimpiar} disabled={fetching}>
          <X className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="w-28 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Cargando…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron empresas
                </TableCell>
              </TableRow>
            ) : (
              rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.id}</TableCell>
                  <TableCell>{e.nombre || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate" title={e.direccion || ""}>{e.direccion || "—"}</TableCell>
                  <TableCell>{e.email || "—"}</TableCell>
                  <TableCell>{e.telefono || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm" title="Ver">
                        <Link href={`/empresas/ver/${e.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" title="Editar">
                        <Link href={`/empresas/${e.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total.toLocaleString("es-MX")} resultado(s) · Página {page} de {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => goPage(page - 1)} disabled={page <= 1 || fetching}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => goPage(page + 1)} disabled={page >= totalPages || fetching}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
