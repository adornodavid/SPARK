"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ShieldX } from "lucide-react"

export default function SinPermisosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ruta = searchParams.get("ruta") || "esta sección del sistema"
  const [segundos, setSegundos] = useState(30)

  useEffect(() => {
    if (segundos <= 0) {
      router.push("/dashboard")
      return
    }
    const timer = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [segundos, router])

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Acceso denegado</h1>

        <p className="mb-2 text-gray-700">
          No tienes permisos para acceder a la ruta{" "}
          <span className="font-semibold text-red-600">{ruta}</span>.
        </p>

        <p className="mb-6 text-gray-600">
          Si es algo importante, comunícate con los administradores del sistema.
        </p>

        <p className="mb-6 text-gray-700">
          Da clic en el siguiente enlace para ser redirigido al{" "}
          <Link
            href="/dashboard"
            className="font-semibold text-blue-600 hover:underline"
          >
            dashboard del sistema
          </Link>{" "}
          o espera a que termine el contador.
        </p>

        <div className="mt-4 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-50">
            <span className="text-3xl font-bold text-gray-900">{segundos}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Redirigiendo al dashboard en {segundos} segundo
            {segundos !== 1 ? "s" : ""}...
          </p>
        </div>
      </div>
    </div>
  )
}
