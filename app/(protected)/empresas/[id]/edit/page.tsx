"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertTriangle, ArrowLeft, X } from "lucide-react"
import { obtenerEmpresa, actualizarEmpresa } from "@/app/actions/empresas"
import {
  buscarClientesParaContacto,
  type ClienteContactoSugerencia,
} from "@/app/actions/clientes"

function nombreCompletoCliente(c: ClienteContactoSugerencia): string {
  const partes = [c.nombre, c.apellidos].filter(Boolean).join(" ").trim()
  return partes || c.email || c.telefono || `Cliente #${c.id}`
}

export default function EditarEmpresaPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params?.id)

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [direccion, setDireccion] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")

  const [contactoInput, setContactoInput] = useState("")
  const [contactoSeleccionado, setContactoSeleccionado] =
    useState<ClienteContactoSugerencia | null>(null)
  const [sugerenciasContacto, setSugerenciasContacto] = useState<ClienteContactoSugerencia[]>([])
  const [buscandoContactos, setBuscandoContactos] = useState(false)

  const [actualizando, setActualizando] = useState(false)
  const [errorUpdate, setErrorUpdate] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    if (!id || Number.isNaN(id)) {
      setErrorCarga("ID de empresa inválido.")
      setCargando(false)
      return
    }
    obtenerEmpresa(id).then((res) => {
      if (cancelado) return
      if (!res.success || !res.data) {
        setErrorCarga(res.error || "No se encontró la empresa.")
        setCargando(false)
        return
      }
      const e = res.data
      setNombre(e.nombre || "")
      setDescripcion(e.descripcion || "")
      setDireccion(e.direccion || "")
      setEmail(e.email || "")
      setTelefono(e.telefono || "")
      if (e.contactoclienteid) {
        setContactoSeleccionado({
          id: e.contactoclienteid,
          nombre: e.contacto_nombre,
          apellidos: null,
          email: null,
          telefono: null,
        })
      }
      setCargando(false)
    })
    return () => {
      cancelado = true
    }
  }, [id])

  useEffect(() => {
    if (contactoSeleccionado) {
      setSugerenciasContacto([])
      return
    }
    const q = contactoInput.trim()
    if (q.length < 2) {
      setSugerenciasContacto([])
      return
    }
    let cancelado = false
    setBuscandoContactos(true)
    const timer = setTimeout(async () => {
      const res = await buscarClientesParaContacto(q)
      if (!cancelado) {
        setSugerenciasContacto(res)
        setBuscandoContactos(false)
      }
    }, 250)
    return () => {
      cancelado = true
      clearTimeout(timer)
    }
  }, [contactoInput, contactoSeleccionado])

  if (cargando) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando empresa…
        </div>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{errorCarga}</div>
        </div>
        <div className="mt-4">
          <Link href="/empresas">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar Empresa</h1>
          <p className="text-sm text-muted-foreground">
            ID: <span className="font-mono">{id}</span>
          </p>
        </div>
        <Link href="/empresas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de la empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={nombre} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción de la empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle, número, colonia, ciudad"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+52 443 123 4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contacto">Contacto cliente</Label>
            {contactoSeleccionado ? (
              <div className="flex h-9 items-center">
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-sm text-blue-900">
                  {nombreCompletoCliente(contactoSeleccionado)}
                  <button
                    type="button"
                    onClick={() => {
                      setContactoSeleccionado(null)
                      setContactoInput("")
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-blue-200"
                    aria-label="Quitar contacto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="contacto"
                  value={contactoInput}
                  onChange={(e) => setContactoInput(e.target.value)}
                  placeholder="Busca por nombre, apellidos, email o teléfono"
                  autoComplete="off"
                />
                {contactoInput.trim().length >= 2 && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-md">
                    {buscandoContactos && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Buscando…</div>
                    )}
                    {!buscandoContactos && sugerenciasContacto.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Sin coincidencias
                      </div>
                    )}
                    {!buscandoContactos &&
                      sugerenciasContacto.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setContactoSeleccionado(c)
                            setSugerenciasContacto([])
                          }}
                          className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <div className="font-medium">{nombreCompletoCliente(c)}</div>
                          <div className="text-xs text-muted-foreground">
                            {[c.email, c.telefono].filter(Boolean).join(" · ")}
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {errorUpdate && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{errorUpdate}</div>
            </div>
          )}

          {okMsg && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              {okMsg}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              disabled={actualizando}
              onClick={async () => {
                setErrorUpdate(null)
                setOkMsg(null)
                setActualizando(true)
                const res = await actualizarEmpresa(id, {
                  descripcion,
                  direccion,
                  email,
                  telefono,
                  contactoclienteid: contactoSeleccionado?.id ?? null,
                })
                if (!res.success) {
                  setErrorUpdate(res.error || "Error actualizando la empresa.")
                  setActualizando(false)
                  return
                }
                setOkMsg("Empresa actualizada correctamente.")
                setActualizando(false)
                router.refresh()
              }}
            >
              {actualizando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando…
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
