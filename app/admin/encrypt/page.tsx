"use client"

/* ==================================================
  Imports
================================================== */
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { obtenerSesion } from "@/app/actions/session"
import { useRouter } from "next/navigation"
import { Encrypt, Desencrypt, HashData } from "@/app/actions/utilerias"

/* ==================================================
  Interfaces, tipados, clases
================================================== */
interface SessionData {
  UsuarioId: string
  Email: string
  Usuario: string
  NombreCompleto: string
  RolId: string
  Rol: string
  Hoteles: string
  SesionActiva: boolean
}

/* ==================================================
  Componente Principal, Pagina
================================================== */
export default function EncryptPage() {
  // --- Variables especiales ---
  const router = useRouter()

  // --- Estados ---
  const [sesion, setSesion] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para encriptación
  const [txtTextoE, setTxtTextoE] = useState("")
  const [txtResultadoE, setTxtResultadoE] = useState("")

  // Estados para desencriptación
  const [txtTextoD, setTxtTextoD] = useState("")
  const [txtResultadoD, setTxtResultadoD] = useState("")

  // Estados para hash
  const [txtTextoH, setTxtTextoH] = useState("")
  const [txtResultadoH, setTxtResultadoH] = useState("")

  // --- Carga Inicial ---
  useEffect(() => {
    cargarSesion()
  }, [])

  // --- Validar sesión ---
  const cargarSesion = async () => {
    try {
      const datosSession = await obtenerSesion()

      if (!datosSession || datosSession.SesionActiva !== true) {
        return
      }

      setSesion(datosSession as SessionData)
    } catch (error) {
      console.error("Error cargando sesión:", error)
    } finally {
      setLoading(false)
    }
  }

  /* ==================================================
    Funciones
  ================================================== */
  const btnAccionE = async () => {
    try {
      if (!txtTextoE.trim()) {
        setError("Por favor ingrese un texto para encriptar")
        return
      }

      const textoEncriptado = await Encrypt(txtTextoE)
      setTxtResultadoE(textoEncriptado)
      setTxtTextoD(textoEncriptado)
      setError(null)
    } catch (error) {
      console.error("Error encriptando:", error)
      setError("Error al encriptar el texto")
    }
  }

  const btnAccionD = async () => {
    try {
      if (!txtTextoD.trim()) {
        setError("Por favor ingrese un texto para desencriptar")
        return
      }

      const textoDesencriptado = await Desencrypt(txtTextoD)
      setTxtResultadoD(textoDesencriptado)
      setError(null)
    } catch (error) {
      console.error("Error desencriptando:", error)
      setError("Error al desencriptar el texto. Verifique que el texto esté correctamente encriptado.")
    }
  }

  const btnAccionH = async () => {
    try {
      if (!txtTextoH.trim()) {
        setError("Por favor ingrese un texto para hashear")
        return
      }

      const textoHasheado = await HashData(txtTextoH)
      setTxtResultadoH(textoHasheado)
      setError(null)
    } catch (error) {
      console.error("Error hasheando:", error)
      setError("Error al hashear el texto")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold text-gray-800">Cargando Pagina...</p>
      </div>
    )
  }

  if (error && !sesion) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Título */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Encryp (bcrypt, crypto)</h1>
      </div>

      {/* Sección de resumen */}
      <div className="text-center mb-6">
        <p className="text-lg text-muted-foreground">
          Esta es una herramienta relacionada con la encriptacion que se utiliza, aqui puedes encriptar o desencriptar
          un texto.
        </p>
      </div>

      {/* Mostrar errores */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sección principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primer div: Encriptar */}
        <Card className="rounded-xs border bg-card text-card-foreground shadow">
          <CardHeader className="text-center">
            <CardTitle>Encriptar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Input
                id="txtTextoE"
                name="txtTextoE"
                type="text"
                value={txtTextoE}
                onChange={(e) => setTxtTextoE(e.target.value)}
                placeholder="Ingrese el texto a encriptar"
                className="w-4/5"
              />
            </div>

            <div className="flex justify-center">
              <Button
                id="btnAccionE"
                name="btnAccionE"
                type="button"
                onClick={btnAccionE}
                className="bg-[#5d8f72] text-white hover:bg-[#44785a]"
              >
                Encriptar
              </Button>
            </div>

            <div className="flex justify-center">
              <Input
                id="txtResultadoE"
                name="txtResultadoE"
                type="text"
                value={txtResultadoE}
                readOnly
                placeholder="Resultado de la encriptación"
                className="w-4/5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Segundo div: Desencriptar */}
        <Card className="rounded-xs border bg-card text-card-foreground shadow">
          <CardHeader className="text-center">
            <CardTitle>Desencriptar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Input
                id="txtTextoD"
                name="txtTextoD"
                type="text"
                value={txtTextoD}
                onChange={(e) => setTxtTextoD(e.target.value)}
                placeholder="Ingrese el texto a desencriptar"
                className="w-4/5"
              />
            </div>

            <div className="flex justify-center">
              <Button
                id="btnAccionD"
                name="btnAccionD"
                type="button"
                onClick={btnAccionD}
                className="bg-[#5d8f72] text-white hover:bg-[#44785a]"
              >
                Desencriptar
              </Button>
            </div>

            <div className="flex justify-center">
              <Input
                id="txtResultadoD"
                name="txtResultadoD"
                type="text"
                value={txtResultadoD}
                readOnly
                placeholder="Resultado de la desencriptación"
                className="w-4/5"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Hash */}
      <div className="flex justify-center">
        <div className="w-full">
          <Card className="rounded-xs border bg-card text-card-foreground shadow">
            <CardHeader className="text-center">
              <CardTitle>Hash (bcrypt)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Input
                  id="txtTextoH"
                  name="txtTextoH"
                  type="text"
                  value={txtTextoH}
                  onChange={(e) => setTxtTextoH(e.target.value)}
                  placeholder="Ingrese el texto a hashear"
                  className="w-4/5"
                />
              </div>

              <div className="flex justify-center">
                <Button
                  id="btnAccionH"
                  name="btnAccionH"
                  type="button"
                  onClick={btnAccionH}
                  className="bg-[#5d8f72] text-white hover:bg-[#44785a]"
                >
                  Hashear
                </Button>
              </div>

              <div className="flex justify-center">
                <Input
                  id="txtResultadoH"
                  name="txtResultadoH"
                  type="text"
                  value={txtResultadoH}
                  readOnly
                  placeholder="Resultado del hash"
                  className="w-4/5"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
