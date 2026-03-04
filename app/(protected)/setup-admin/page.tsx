"use client"

import { useState } from "react"
import { createAdminUser } from "@/app/actions/setup-admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleCreateAdmin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await createAdminUser()
      setResult(response)
    } catch (error) {
      setResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Configuración Inicial</CardTitle>
          <CardDescription>Crear usuario administrador del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Email:</strong> arkamia.ti.ia@gmail.com
            </p>
            <p>
              <strong>Contraseña:</strong> Arkamia25
            </p>
            <p>
              <strong>Rol:</strong> Superadministrador
            </p>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5" />
                )}
                <AlertDescription>
                  {result.success ? (
                    <div>
                      <p className="font-medium text-green-600">¡Usuario creado exitosamente!</p>
                      <p className="text-sm mt-1">Ya puedes iniciar sesión con las credenciales proporcionadas.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Error al crear usuario</p>
                      <p className="text-sm mt-1">{result.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <Button onClick={handleCreateAdmin} disabled={loading || result?.success} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando usuario...
              </>
            ) : result?.success ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Usuario creado
              </>
            ) : (
              "Crear Usuario Administrador"
            )}
          </Button>

          {result?.success && (
            <p className="text-sm text-center text-muted-foreground">
              Puedes cerrar esta página y proceder al{" "}
              <a href="/login" className="text-primary underline">
                inicio de sesión
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
