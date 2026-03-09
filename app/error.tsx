"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[SPARK] Error global:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        {/* SPARK Logo */}
        <div className="mb-8">
          <span className="text-3xl font-bold tracking-wider text-foreground">
            SPARK
          </span>
        </div>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Algo salio mal
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Ocurrio un error inesperado. Por favor, intenta de nuevo.
        </p>

        {process.env.NODE_ENV === "development" && error?.message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-left dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-xs font-medium text-red-800 dark:text-red-400">
              Error (dev only):
            </p>
            <p className="mt-1 text-xs text-red-600 break-all dark:text-red-300">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-400 dark:text-red-500">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Reintentar
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Ir al Dashboard
          </a>
        </div>

        <p className="mt-12 text-xs text-muted-foreground/60">
          SPARK &mdash; Portal Comercial &amp; Banquetes MGHM
        </p>
      </div>
    </div>
  )
}
