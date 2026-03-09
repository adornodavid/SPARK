"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, UserX, Lock, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { loginUser } from "@/app/actions/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [showEmptyFieldsModal, setShowEmptyFieldsModal] = useState(false)
  const [showInactiveUserModal, setShowInactiveUserModal] = useState(false)
  const [showCredentialsErrorModal, setShowCredentialsErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (email.trim().length <= 1 || password.trim().length <= 3) {
      setShowEmptyFieldsModal(true)
      return
    }

    setIsLoading(true)

    try {
      const result = await loginUser(email.trim(), password)

      if (!result.success) {
        if (result.error === "inactive") {
          setShowInactiveUserModal(true)
        } else {
          setErrorMessage(result.message || "El correo electronico o la contrasena son incorrectos.")
          setShowCredentialsErrorModal(true)
        }
        setIsLoading(false)
        return
      }

      if (result.role === "admin_principal" || result.role === "admin_general") {
        router.push("/dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Error al iniciar sesion")
      setShowCredentialsErrorModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex min-h-svh w-full bg-[#fffcfa]">
        <div className="absolute left-6 top-6 z-10">
          <img src="/logo-milenium.png" alt="Milenium Grupo Hotelero" className="h-12 w-auto" />
        </div>

        {/* Left Side - Login Form */}
        <div className="flex w-full items-center justify-center p-6 md:w-1/2 lg:p-10">
          <div className="w-full max-w-md">
            <div className="flex flex-col gap-8">
              {/* Header Section */}
              <div className="flex flex-col gap-3">
                <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight">
                  Portal Banquetes y Comercial
                  <br />
                  <span className="text-primary"></span>
                </h1>
                <p className="text-lg text-muted-foreground">El sistema para los que hacen eventos memorables</p>
              </div>

              {/* Login Form Card */}
              <div className="rounded-3xl border bg-card p-8 shadow-sm">
                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                  {/* Email/Username Field */}
                  <div className="group relative">
                    <Label htmlFor="email" className="mb-2 block text-sm font-medium">
                      Usuario o Correo
                    </Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <User className="h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      </div>
                      <Input
                        id="email"
                        type="text"
                        placeholder="usuario@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="h-12 rounded-xl border-2 pl-12 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="group relative">
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Contrasena
                      </Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                      >
                        Olvidaste tu contrasena?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Lock className="h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="--------"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="h-12 rounded-xl border-2 pl-12 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="h-12 rounded-xl bg-foreground text-base font-semibold text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 active:scale-[0.98]"
                  >
                    {isLoading ? "Iniciando sesion..." : "Iniciar Sesion"}
                  </Button>
                </form>

                {/* Footer Note */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Al iniciar sesion, aceptas nuestros terminos y condiciones
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Event Image Section */}
        <div className="relative hidden items-center justify-center bg-[#fffcfa] p-10 md:flex md:w-1/2">
          {/* Decorative Confetti Lines */}
          <svg className="absolute left-16 top-24 h-32 w-32 opacity-40" viewBox="0 0 100 100">
            <path d="M10,50 Q30,20 50,40 T90,30" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
            <path d="M20,30 Q40,60 60,40 T100,50" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
            <path d="M5,70 Q25,50 45,60 T85,70" fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray="5,5" />
          </svg>

          <svg className="absolute bottom-24 right-20 h-40 w-40 opacity-40" viewBox="0 0 100 100">
            <path d="M10,50 Q30,80 50,60 T90,70" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5,5" />
            <path d="M20,70 Q40,40 60,60 T100,50" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" />
            <path d="M5,30 Q25,70 45,40 T85,30" fill="none" stroke="#14b8a6" strokeWidth="2" strokeDasharray="5,5" />
          </svg>

          {/* Main Image Container */}
          <div className="relative h-full w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl">
            <img
              src="/elegant-banquet-hall-setup-wedding-reception-luxur.jpg"
              alt="Eventos de Banquetes Elegantes"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={showEmptyFieldsModal} onOpenChange={setShowEmptyFieldsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Campos Requeridos</DialogTitle>
            <DialogDescription className="text-center">
              El usuario debe tener mas de 1 caracter y la contrasena debe tener mas de 3 caracteres. Por favor,
              completa los datos correctamente para poder ingresar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowEmptyFieldsModal(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInactiveUserModal} onOpenChange={setShowInactiveUserModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserX className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Usuario Inactivo</DialogTitle>
            <DialogDescription className="text-center">
              Tu cuenta de usuario se encuentra inactiva. Por favor, comunicate con el administrador principal del
              sistema para reactivar tu acceso.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setShowInactiveUserModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCredentialsErrorModal} onOpenChange={setShowCredentialsErrorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Error de Autenticacion</DialogTitle>
            <DialogDescription className="text-center">{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowCredentialsErrorModal(false)}>Intentar de nuevo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
