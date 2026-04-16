"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Plus, Download, RefreshCw, Loader2, Search, X, Eye, Edit, ChevronLeft, ChevronRight, Square, DatabaseZap } from "lucide-react"
import Link from "next/link"
import {
  transferirNuevosDesdePipedrive,
  actualizarClientesDesdePipedrive,
  listarClientesPaginado,
} from "@/app/actions/clientes"
import { extraerLotePersons } from "@/app/actions/pipedrive"
import type { ErrorDetalle } from "@/app/actions/pipedrive"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ClienteRow = {
  id: number
  nombre: string | null
  apellidos: string | null
  email: string | null
  telefono: string | null
}

const PAGE_SIZE = 50

export default function ClientsPage() {
  const router = useRouter()
  const cancelRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "error"; msg: string } | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [searchActive, setSearchActive] = useState("")
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<ClienteRow[]>([])
  const [total, setTotal] = useState(0)
  const [fetching, setFetching] = useState(false)

  // Progreso extracción Pipedrive → pip_persons
  const [progreso, setProgreso] = useState({ insertados: 0, omitidos: 0, errores: 0, procesados: 0, loteActual: 0 })
  const [erroresDetalle, setErroresDetalle] = useState<ErrorDetalle[]>([])
  const [fase, setFase] = useState<"idle" | "extrayendo" | "transfiriendo" | "hecho">("idle")
  const [resultadoTransfer, setResultadoTransfer] = useState<{ insertados: number; skipeados_dup: number } | null>(null)

  async function fetchRows(s: string, p: number) {
    setFetching(true)
    const r = await listarClientesPaginado(s, p, PAGE_SIZE)
    setFetching(false)
    if (r.success) {
      setRows(r.data as ClienteRow[])
      setTotal(r.total ?? 0)
    } else {
      setFeedback({ tipo: "error", msg: r.error || "Error al cargar clientes" })
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
      if (!allowedRoles.includes(Number(session.RolId))) {
        router.push("/dashboard")
        return
      }
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
    if (!confirm("¿Insertar en clientes todos los registros nuevos de pip_persons (omitiendo duplicados por pipedrive_id, email o teléfono)?")) return
    setImporting(true)
    setFeedback(null)
    const r = await transferirNuevosDesdePipedrive()
    setImporting(false)
    if (r.success) {
      setFeedback({ tipo: "ok", msg: `Insertados: ${r.insertados}. Skipeados por duplicado: ${r.skipeados_dup}.` })
      await fetchRows(searchActive, 1)
      setPage(1)
    } else {
      setFeedback({ tipo: "error", msg: r.error || "Error desconocido" })
    }
  }

  // Loop de extracción pip_persons (modo "Solo nuevos") + transferencia a clientes
  async function onActualizarExistentes() {
    if (!confirm("Se extraerán nuevas personas desde Pipedrive → pip_persons, luego se insertarán en clientes (omitiendo duplicados por pipedrive_id, email o teléfono). ¿Continuar?")) return

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

        const resultado = await extraerLotePersons(start)

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

        // Modo "Solo nuevos": corta cuando el lote entero fue omitido
        if (resultado.insertados === 0 && resultado.omitidos === resultado.total_lote) break
        if (!resultado.hay_mas) break

        start = resultado.next_start
      }

      // Segunda fase: transfiere a clientes con dedupe
      setFase("transfiriendo")
      const r = await transferirNuevosDesdePipedrive()
      if (r.success) {
        setResultadoTransfer({ insertados: r.insertados ?? 0, skipeados_dup: r.skipeados_dup ?? 0 })
        setFeedback({
          tipo: "ok",
          msg: `Pipedrive → pip_persons: ${totalInsertados} insertados. pip_persons → clientes: ${r.insertados} insertados, ${r.skipeados_dup} duplicados omitidos.`,
        })
      } else {
        setFeedback({ tipo: "error", msg: r.error || "Error en transferencia a clientes" })
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

  async function onActualizarDesdeTablaEspecial() {
    if (!confirm("Se actualizarán los campos de clientes con los valores de pip_persons donde coincida pipedrive_id. ¿Continuar?")) return
    setSyncing(true)
    setFeedback(null)
    const r = await actualizarClientesDesdePipedrive()
    setSyncing(false)
    if (r.success) {
      setFeedback({ tipo: "ok", msg: `Clientes actualizados: ${r.actualizados}.` })
      await fetchRows(searchActive, page)
    } else {
      setFeedback({ tipo: "error", msg: r.error || "Error desconocido" })
    }
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
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu cartera de clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onImportarNuevos} disabled={importing || updating || syncing}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Importar nuevos de Pipedrive
          </Button>
          <Button variant="outline" onClick={onActualizarExistentes} disabled={importing || updating || syncing}>
            {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar con Pipedrive
          </Button>
          <Button variant="outline" onClick={onActualizarDesdeTablaEspecial} disabled={importing || updating || syncing}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
            Actualizar clientes desde tabla especial
          </Button>
          <Button asChild>
            <Link href="/clientes/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Link>
          </Button>
        </div>
      </div>

      {(updating || fase === "hecho") && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              {fase === "extrayendo" && <><Loader2 className="h-4 w-4 animate-spin" /> Extrayendo desde Pipedrive → pip_persons (lote {progreso.loteActual})</>}
              {fase === "transfiriendo" && <><Loader2 className="h-4 w-4 animate-spin" /> Transfiriendo pip_persons → clientes</>}
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
            <div><p className="text-muted-foreground text-xs">Insertados en pip_persons</p><p className="font-semibold text-emerald-600">{progreso.insertados}</p></div>
            <div><p className="text-muted-foreground text-xs">Omitidos (ya existían)</p><p className="font-semibold text-amber-600">{progreso.omitidos}</p></div>
            <div><p className="text-muted-foreground text-xs">Errores</p><p className="font-semibold text-red-600">{progreso.errores}</p></div>
            <div><p className="text-muted-foreground text-xs">Lote actual</p><p className="font-semibold">{progreso.loteActual}</p></div>
          </div>
          {resultadoTransfer && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm grid grid-cols-2 gap-3">
              <div><p className="text-muted-foreground text-xs">Insertados en clientes</p><p className="font-semibold text-emerald-600">{resultadoTransfer.insertados}</p></div>
              <div><p className="text-muted-foreground text-xs">Duplicados omitidos (pipedrive_id / email / teléfono)</p><p className="font-semibold text-amber-600">{resultadoTransfer.skipeados_dup}</p></div>
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
          placeholder="Buscar por id, nombre, apellidos, email o teléfono…"
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
              <TableHead>Apellidos</TableHead>
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
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell>{c.nombre || "—"}</TableCell>
                  <TableCell>{c.apellidos || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.telefono || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm" title="Ver">
                        <Link href={`/clientes/ver/${c.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" title="Editar">
                        <Link href={`/clientes/${c.id}/edit`}>
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
