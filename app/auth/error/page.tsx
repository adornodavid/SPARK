import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-destructive">Error de autenticación</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {params?.error_description ? (
                <p className="text-sm text-muted-foreground">{params.error_description}</p>
              ) : params?.error ? (
                <p className="text-sm text-muted-foreground">Código de error: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Ocurrió un error inesperado durante la autenticación.</p>
              )}
              <Button asChild>
                <Link href="/auth/login">Volver al inicio de sesión</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
