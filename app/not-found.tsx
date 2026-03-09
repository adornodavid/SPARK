import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        {/* SPARK Logo */}
        <div className="mb-8">
          <span className="text-4xl font-bold tracking-wider text-foreground">
            SPARK
          </span>
        </div>

        {/* 404 Number */}
        <div className="mb-6">
          <span className="text-8xl font-bold text-lime-600/20">404</span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Pagina no encontrada
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          La pagina que buscas no existe o fue movida. Verifica la URL o regresa al inicio.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Ir al Inicio
          </Link>
        </div>

        <p className="mt-12 text-xs text-muted-foreground/60">
          SPARK &mdash; Portal Comercial &amp; Banquetes MGHM
        </p>
      </div>
    </div>
  )
}
