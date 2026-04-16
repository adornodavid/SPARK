"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, CheckCircle2, AlertCircle, User } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { validarTokenPassword, cambiarPassword } from "@/app/actions/auth"

export default function CambiarContrasenaPage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") || ""
  const idParam = params.get("id") || ""
  const usuarioId = parseInt(idParam, 10) || 0

  const [loading, setLoading] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [usuario, setUsuario] = useState<{ id: number; nombrecompleto: string; email: string } | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validar token al cargar
  useEffect(() => {
    async function validar() {
      setLoading(true)
      const result = await validarTokenPassword(token, usuarioId)
      if (!result.success) {
        setValidationError(result.message || "Enlace inválido.")
      } else if (result.usuario) {
        setUsuario(result.usuario)
      }
      setLoading(false)
    }
    validar()
  }, [token, usuarioId])

  // Redirect after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push("/auth/login"), 3000)
      return () => clearTimeout(timer)
    }
  }, [success, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (password.length < 4) {
      setFormError("La contraseña debe tener al menos 4 caracteres.")
      return
    }
    if (password !== confirmPassword) {
      setFormError("Las contraseñas no coinciden.")
      return
    }

    setSubmitting(true)
    const result = await cambiarPassword(token, usuarioId, password, confirmPassword)
    setSubmitting(false)

    if (!result.success) {
      setFormError(result.message || "No se pudo actualizar la contraseña.")
      return
    }

    setSuccess(true)
  }

  /* ======= Estados de render ======= */

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 bg-muted/30">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground" />
          Validando enlace...
        </div>
      </div>
    )
  }

  if (validationError) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 bg-muted/30">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-xl">Enlace no válido</CardTitle>
              </div>
              <CardDescription className="pt-2">{validationError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/auth/login">Volver al inicio de sesión</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 bg-muted/30">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-xl">Contraseña actualizada</CardTitle>
              </div>
              <CardDescription className="pt-2">
                Tu contraseña se cambió correctamente. Serás redirigido al inicio de sesión en 3 segundos...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/auth/login">Ir al inicio de sesión</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md space-y-4">
        {/* Info usuario */}
        {usuario && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-full bg-primary/10 p-3 shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restableciendo contraseña de</p>
                <p className="font-semibold">{usuario.nombrecompleto}</p>
                <p className="text-sm text-muted-foreground">{usuario.email}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Nueva contraseña</CardTitle>
            <CardDescription>Ingresa tu nueva contraseña y confírmala.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 4 caracteres"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite la contraseña"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Guardando..." : "Cambiar contraseña"}
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="/auth/login">Cancelar</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
