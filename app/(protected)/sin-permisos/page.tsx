import { Suspense } from "react"
import SinPermisosContent from "./sin-permisos-content"

export default function SinPermisosPage() {
  return (
    <Suspense fallback={null}>
      <SinPermisosContent />
    </Suspense>
  )
}
