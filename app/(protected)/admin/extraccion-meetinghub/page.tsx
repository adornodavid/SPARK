"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { listarMh, subirExcelMh } from "@/app/actions/mh-extraccion"

const PESTANAS: Array<{ key: string; label: string }> = [
  { key: "eventos", label: "Eventos" },
  { key: "eventos_salones", label: "Eventos Salones" },
  { key: "estatus", label: "Estatus" },
  { key: "segmentos", label: "Segmentos" },
  { key: "tipo_evento", label: "Tipo Evento" },
  { key: "hoteles", label: "Hoteles" },
  { key: "salones", label: "Salones" },
  { key: "montajes", label: "Montajes" },
  { key: "montaje_salon", label: "Montaje Salon" },
  { key: "contactos", label: "Contactos" },
]

const PAGE_SIZE = 50

export default function ExtraccionMeetinghubPage() {
  const router = useRouter()
  const [tablaActiva, setTablaActiva] = useState<string>("eventos")
  const [columnas, setColumnas] = useState<string[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [errorListado, setErrorListado] = useState<string | null>(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [tablaModal, setTablaModal] = useState<string>("eventos")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [mensajeModal, setMensajeModal] = useState<{ tipo: "ok" | "err"; texto: string } | null>(
    null,
  )

  const cargar = useCallback(async (tablaKey: string, page: number) => {
    setCargando(true)
    setErrorListado(null)
    const res = await listarMh(tablaKey, PAGE_SIZE, page * PAGE_SIZE)
    if (res.success) {
      setColumnas(res.columnas)
      setRows(res.rows)
      setTotal(res.total)
    } else {
      setErrorListado(res.error || "Error al listar")
      setColumnas([])
      setRows([])
      setTotal(0)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    setPagina(0)
    cargar(tablaActiva, 0)
  }, [tablaActiva, cargar])

  function abrirModal() {
    setTablaModal(tablaActiva)
    setArchivo(null)
    setMensajeModal(null)
    setModalAbierto(true)
  }

  async function subir() {
    if (!archivo) {
      setMensajeModal({ tipo: "err", texto: "Selecciona un archivo Excel" })
      return
    }
    setSubiendo(true)
    setMensajeModal(null)
    const fd = new FormData()
    fd.set("tabla", tablaModal)
    fd.set("archivo", archivo)
    const res = await subirExcelMh(fd)
    setSubiendo(false)
    if (res.success) {
      setMensajeModal({
        tipo: "ok",
        texto: `${res.procesados} filas procesadas en ${res.tabla}`,
      })
      if (tablaModal === tablaActiva) {
        await cargar(tablaActiva, pagina)
      }
    } else {
      setMensajeModal({
        tipo: "err",
        texto: `${res.error}${res.procesados ? ` (procesados: ${res.procesados})` : ""}`,
      })
    }
  }

  function renderCell(val: any) {
    if (val === null || val === undefined)
      return <span className="text-muted-foreground">—</span>
    if (typeof val === "boolean") return val ? "Sí" : "No"
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
      try {
        return new Date(val).toLocaleString("es-MX")
      } catch {
        return val
      }
    }
    return String(val)
  }

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Extracción MeetingHub</h1>
          <p className="text-muted-foreground mt-1">
            Carga masiva desde Excel. Cada pestaña representa una tabla destino.
          </p>
        </div>
      </div>

      <Tabs value={tablaActiva} onValueChange={setTablaActiva} className="w-full">
        <TabsList className="flex flex-wrap h-auto w-full justify-start">
          {PESTANAS.map((p) => (
            <TabsTrigger key={p.key} value={p.key}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex justify-end my-4">
          <Button onClick={abrirModal}>
            <Upload className="mr-2 h-4 w-4" />
            Nueva Extracción
          </Button>
        </div>

        {PESTANAS.map((p) => (
          <TabsContent key={p.key} value={p.key} className="mt-0">
            <Card>
              <CardContent className="p-4">
                {cargando ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : errorListado ? (
                  <div className="text-red-600 py-8 text-center">{errorListado}</div>
                ) : rows.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">Sin registros</div>
                ) : (
                  <>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {columnas.map((c) => (
                              <TableHead key={c} className="whitespace-nowrap">
                                {c}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row, i) => (
                            <TableRow key={`row-${i}`}>
                              {columnas.map((c) => (
                                <TableCell key={c} className="whitespace-nowrap">
                                  {renderCell(row[c])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        {total.toLocaleString("es-MX")} registros · Página {pagina + 1} de{" "}
                        {totalPaginas}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagina === 0 || cargando}
                          onClick={() => {
                            const np = pagina - 1
                            setPagina(np)
                            cargar(tablaActiva, np)
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagina + 1 >= totalPaginas || cargando}
                          onClick={() => {
                            const np = pagina + 1
                            setPagina(np)
                            cargar(tablaActiva, np)
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Extracción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tabla destino</Label>
              <Select value={tablaModal} onValueChange={setTablaModal} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PESTANAS.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <a
                href={`/plantillas-mh/mh_${tablaModal}.xlsx`}
                download
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar plantilla de {PESTANAS.find((p) => p.key === tablaModal)?.label}
              </a>
            </div>
            <div className="space-y-2">
              <Label>Archivo Excel</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Por cada fila del Excel, si el ID existe se actualiza; si no, se inserta.
              </p>
            </div>
            {mensajeModal && (
              <div
                className={
                  mensajeModal.tipo === "ok"
                    ? "text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2"
                    : "text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2"
                }
              >
                {mensajeModal.texto}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)} disabled={subiendo}>
              Cerrar
            </Button>
            <Button onClick={subir} disabled={!archivo || subiendo}>
              {subiendo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
