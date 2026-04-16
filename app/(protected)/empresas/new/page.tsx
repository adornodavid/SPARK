"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle2, ArrowLeft, X } from "lucide-react"
import {
  validarEmpresaEnPipedrive,
  type MatchEmpresaPipedrive,
} from "@/app/actions/pipedrive"
import { crearEmpresaNueva } from "@/app/actions/empresas"
import {
  buscarClientesParaContacto,
  type ClienteContactoSugerencia,
} from "@/app/actions/clientes"

type EstadoValidacion =
  | { tipo: "idle" }
  | { tipo: "validando" }
  | { tipo: "disponible"; mensaje: string }
  | { tipo: "existe"; mensaje: string; matches: MatchEmpresaPipedrive[] }
  | { tipo: "error"; mensaje: string }

function nombreCompletoCliente(c: ClienteContactoSugerencia): string {
  const partes = [c.nombre, c.apellidos].filter(Boolean).join(" ").trim()
  return partes || c.email || c.telefono || `Cliente #${c.id}`
}

export default function NuevaEmpresaPage() {
  const router = useRouter()

  const [nombre, setNombre] = useState("")
  const [estado, setEstado] = useState<EstadoValidacion>({ tipo: "idle" })

  const [descripcion, setDescripcion] = useState("")
  const [direccion, setDireccion] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")

  const [contactoInput, setContactoInput] = useState("")
  const [contactoSeleccionado, setContactoSeleccionado] =
    useState<ClienteContactoSugerencia | null>(null)
  const [sugerenciasContacto, setSugerenciasContacto] = useState<ClienteContactoSugerencia[]>([])
  const [buscandoContactos, setBuscandoContactos] = useState(false)

  const [registrando, setRegistrando] = useState(false)
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null)

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

  const handleValidar = async () => {
    if (!nombre.trim()) {
      setEstado({ tipo: "error", mensaje: "Debes ingresar el nombre de la empresa para validar." })
      return
    }
    setEstado({ tipo: "validando" })
    const res = await validarEmpresaEnPipedrive(nombre)
    if (!res.success) {
      setEstado({ tipo: "error", mensaje: res.mensaje })
      return
    }
    if (res.disponible) {
      setEstado({ tipo: "disponible", mensaje: res.mensaje })
    } else {
      setEstado({ tipo: "existe", mensaje: res.mensaje, matches: res.matches })
    }
  }

  const handleReset = () => setEstado({ tipo: "idle" })

  const validando = estado.tipo === "validando"

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nueva Empresa</h1>
          <p className="text-sm text-muted-foreground">Registra una nueva empresa en el sistema</p>
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
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Paso 1: Validación en Pipedrive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            Antes de registrar una nueva empresa, se validará que el <strong>nombre</strong> no
            exista previamente en Pipedrive ni en la tabla empresas. Si ya existe, significa que
            la empresa ya está creada y debes ejecutar el proceso{" "}
            <strong>&quot;Actualizar con Pipedrive&quot;</strong> en la pantalla de{" "}
            <Link href="/empresas" className="underline">
              /empresas
            </Link>{" "}
            para sincronizarla al sistema.
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la empresa</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                if (estado.tipo !== "idle" && estado.tipo !== "validando") handleReset()
              }}
              placeholder="Ej: Grupo Hotelero Milenium"
              disabled={validando}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleValidar} disabled={validando}>
              {validando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando…
                </>
              ) : (
                "Validar"
              )}
            </Button>
          </div>

          {estado.tipo === "error" && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{estado.mensaje}</div>
            </div>
          )}

          {estado.tipo === "disponible" && (
            <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{estado.mensaje}</div>
            </div>
          )}

          {estado.tipo === "existe" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">{estado.mensaje}</div>
                  <div className="mt-1">
                    No se puede continuar con el alta. Ve a{" "}
                    <Link href="/empresas" className="underline font-medium">
                      /empresas
                    </Link>{" "}
                    y ejecuta <strong>&quot;Actualizar con Pipedrive&quot;</strong>.
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Fuente</th>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Dirección</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estado.matches.map((m) => (
                      <tr key={`${m.fuente}-${m.id}`} className="border-t">
                        <td className="px-3 py-2">
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              m.fuente === "pipedrive"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-purple-100 text-purple-900"
                            }`}
                          >
                            {m.fuente === "pipedrive" ? "Pipedrive" : "Empresas"}
                          </span>
                        </td>
                        <td className="px-3 py-2">{m.id}</td>
                        <td className="px-3 py-2">{m.nombre}</td>
                        <td className="px-3 py-2">{m.direccion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {estado.tipo === "disponible" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de la empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {errorRegistro && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{errorRegistro}</div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                disabled={!nombre.trim() || registrando}
                onClick={async () => {
                  setErrorRegistro(null)
                  if (!nombre.trim()) {
                    setErrorRegistro("El nombre de la empresa es obligatorio.")
                    return
                  }
                  setRegistrando(true)
                  const res = await crearEmpresaNueva({
                    nombre,
                    descripcion,
                    direccion,
                    email,
                    telefono,
                    contactoclienteid: contactoSeleccionado?.id ?? null,
                  })
                  if (!res.success) {
                    setErrorRegistro(res.error || "Error registrando la empresa.")
                    setRegistrando(false)
                    return
                  }
                  router.push("/empresas")
                }}
              >
                {registrando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando…
                  </>
                ) : (
                  "Registrar"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
