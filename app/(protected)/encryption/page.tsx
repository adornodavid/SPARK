"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Encrypt, Desencrypt, HashData } from "@/app/actions/utilerias"
import { obtenerSesion } from "@/app/actions/session"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Lock, Hash } from "lucide-react"

export default function EncryptionPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Encrypt state
  const [textToEncrypt, setTextToEncrypt] = useState("")
  const [encryptedResult, setEncryptedResult] = useState("")
  const [isEncrypting, setIsEncrypting] = useState(false)

  // Decrypt state
  const [textToDecrypt, setTextToDecrypt] = useState("")
  const [decryptedResult, setDecryptedResult] = useState("")
  const [isDecrypting, setIsDecrypting] = useState(false)

  // Hash state
  const [textToHash, setTextToHash] = useState("")
  const [hashedResult, setHashedResult] = useState("")
  const [isHashing, setIsHashing] = useState(false)

  // Verificar que el usuario sea admin_principal
  useEffect(() => {
    async function checkAuthorization() {
      const session = await obtenerSesion()
      if (!session || session.Rol !== "admin_principal") {
        router.push("/admin")
        return
      }
      setIsAuthorized(true)
      setIsLoading(false)
    }
    checkAuthorization()
  }, [router])

  // Función para encriptar
  const handleEncrypt = async () => {
    if (!textToEncrypt.trim()) return
    setIsEncrypting(true)
    try {
      const result = await Encrypt(textToEncrypt)
      setEncryptedResult(result)
    } catch (error) {
      setEncryptedResult("Error al encriptar")
    }
    setIsEncrypting(false)
  }

  // Función para desencriptar
  const handleDecrypt = async () => {
    if (!textToDecrypt.trim()) return
    setIsDecrypting(true)
    try {
      const result = await Desencrypt(textToDecrypt)
      setDecryptedResult(result)
    } catch (error) {
      setDecryptedResult("Error al desencriptar")
    }
    setIsDecrypting(false)
  }

  // Función para hashear
  const handleHash = async () => {
    if (!textToHash.trim()) return
    setIsHashing(true)
    try {
      const result = await HashData(textToHash)
      setHashedResult(result)
    } catch (error) {
      setHashedResult("Error al convertir a hash")
    }
    setIsHashing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Verificando permisos...</p>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Herramientas de Encriptación</h1>
        <p className="text-muted-foreground">Utilidades para encriptar, desencriptar y hashear texto</p>
      </div>

      {/* Sección Encrypt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Encrypt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna 1: Encriptar */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="encrypt-input">Texto a encriptar</Label>
                <Input
                  id="encrypt-input"
                  placeholder="Ingresa el texto a encriptar"
                  value={textToEncrypt}
                  onChange={(e) => setTextToEncrypt(e.target.value)}
                />
              </div>
              <Button onClick={handleEncrypt} disabled={isEncrypting || !textToEncrypt.trim()}>
                {isEncrypting ? "Encriptando..." : "Encriptar"}
              </Button>
              <div className="space-y-2">
                <Label>Resultado encriptado</Label>
                <div className="min-h-[80px] p-3 bg-muted rounded-md border text-sm break-all">
                  {encryptedResult || <span className="text-muted-foreground">El resultado aparecerá aquí</span>}
                </div>
              </div>
            </div>

            {/* Columna 2: Desencriptar */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="decrypt-input">Texto a desencriptar</Label>
                <Input
                  id="decrypt-input"
                  placeholder="Ingresa el texto encriptado"
                  value={textToDecrypt}
                  onChange={(e) => setTextToDecrypt(e.target.value)}
                />
              </div>
              <Button onClick={handleDecrypt} disabled={isDecrypting || !textToDecrypt.trim()}>
                {isDecrypting ? "Desencriptando..." : "Desencriptar"}
              </Button>
              <div className="space-y-2">
                <Label>Resultado desencriptado</Label>
                <div className="min-h-[80px] p-3 bg-muted rounded-md border text-sm break-all">
                  {decryptedResult || <span className="text-muted-foreground">El resultado aparecerá aquí</span>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección Hash */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Hash
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hash-input">Texto a convertir</Label>
              <Input
                id="hash-input"
                placeholder="Ingresa el texto a convertir en hash"
                value={textToHash}
                onChange={(e) => setTextToHash(e.target.value)}
              />
            </div>
            <Button onClick={handleHash} disabled={isHashing || !textToHash.trim()}>
              {isHashing ? "Convirtiendo..." : "Convertir HASH"}
            </Button>
            <div className="space-y-2">
              <Label>Resultado</Label>
              <div className="min-h-[80px] p-3 bg-muted rounded-md border text-sm break-all">
                {hashedResult || <span className="text-muted-foreground">El resultado aparecerá aquí</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
