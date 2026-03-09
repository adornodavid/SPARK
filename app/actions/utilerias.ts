"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import { encryptData, decryptData } from "@/lib/encryption"
import bcrypt from "bcryptjs"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  Funciones: Imagenes
  --------------------
  *
    - imagenValidaciones / imageValidations
    - imagenSubir / imageUpload
    - imagenSubirFormData / imageUploadFormData
    - imagenBorrar / imageDelete
    - imagenBuscar / imageSearch ?
    - imagenSustituir / imageReplace ?
    - imagenUrl / imageUrl ?

  --------------------
  Funciones: Textos
  --------------------
  *
    - textoLimpiarParaProceder / textCleanToProcess
    - textoEliminarCaracter / textDeleteChart ? usar funcion JS .replace
    - textoCambiarCaracter / textReplaceChart ? usar funcion JS .replace

  --------------------
  Funciones: Encryption
  --------------------
  *
    - Encrypt - (Crypto-js)
    - Desencrypt - (Crypto-js)
    - HashData - (Bcrypt-js)
    - CompareHash - (Bcrypt-js)
================================================== */

/* ==================================================
  Funciones: Imagenes
================================================== */
// Función: imagenSubir / imageUpload: Subir una imagen a un repositorio/folder
export async function imagenSubir(imageFile: File, name: string, folder: string) {
  try {
    // Validar que se recibió archivo
    if (!imageFile || imageFile.size === 0) {
      return { success: false, error: "No se proporcionó una imagen válida" }
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(imageFile.type)) {
      return { success: false, error: "Tipo de archivo no válido" }
    }

    // Validar tamaño máximo (10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (imageFile.size > MAX_SIZE) {
      return { success: false, error: "La imagen excede el tamaño máximo de 10MB" }
    }

    // Crear nombre con extensión
    const fileExtension = imageFile.name.split(".").pop()
    const fileName = `${name}-${Date.now()}.${fileExtension}`

    // Subir imagen al bucket "Imagenes"
    const fullPath = `${folder}/${fileName}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("Imagenes")
      .upload(fullPath, imageFile)

    // Si se presentó un error
    if (uploadError) {
      console.error("Error subiendo imagen en actions/utilerias imagenSubir:", uploadError)
      return { success: false, error: "Error al subir la imagen: " + uploadError.message }
    }

    // Obtener URL
    const { data: urlData } = supabase.storage.from("Imagenes").getPublicUrl(fullPath)
    if (!urlData) {
      return { success: false, error: "No se obtuvo la url en imagenSubir de actions/utilerias." }
    }

    // Retorno de resultado exitoso
    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error("Error procesando subida de imagen en imagenSubir de actions/utilerias: ", error)
    return { success: false, error: "Error procesando subida de imagen en imagenSubir de actions/utilerias: " + error }
  }
}

// Función: imagenSubirFormData — wrapper que recibe FormData (file, folder, name)
export async function imagenSubirFormData(fd: FormData) {
  const file = fd.get("file") as File
  const folder = fd.get("folder") as string
  const name = fd.get("name") as string
  console.log(`[imagenSubirFormData] Bucket: "Imagenes" | Ruta: ${folder}/${name}-[timestamp] | Archivo: ${file?.name} (${file?.size} bytes)`)
  return imagenSubir(file, name, folder)
}

// Función: imagenBorrar / imageDelete: Eliminar una imagen de un repositorio/folder
export async function imagenBorrar(imageUrl: string, folder: string) {
  // Validar que se recibió la URL
  if (!imageUrl || imageUrl.trim() === "") {
    return { success: false, error: "No se proporcionó una URL válida" }
  }

  try {
    // Extraer el nombre del archivo de la URL
    const urlParts = imageUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]

    // Construir la ruta completa del archivo en el bucket
    const filePath = `${folder}/${fileName}`

    // Eliminar la imagen del bucket de Supabase
    const { data, error } = await supabase.storage.from("Imagenes").remove([filePath])

    // Si se presentó un error
    if (error) {
      console.error("Error borrando imagen en actions/utilerias imagenBorrar:", error)
      return { success: false, error: "Error al borrar la imagen" }
    }

    // Retorno de resultado exitoso
    return { success: true, message: "Imagen eliminada correctamente" }
  } catch (error) {
    console.error("Error procesando la eliminación de imagen:", error)
    return { success: false, error: "Error al procesar la eliminación de la imagen" }
  }
}

/* ==================================================
  Funciones: Textos
================================================== */
// Función: textoLimpiarParaProceder / textCleanToProcess: Quitar caracteres que pueden afectar proceso, evitar inyecciones SQL
export async function textoLimpiarParaProceder(texto: string): Promise<string> {
  // Validar que se recibió un string válido
  if (!texto || typeof texto !== "string") {
    return ""
  }

  // Eliminar espacios al inicio y final
  let textoLimpio = texto.trim()

  // Eliminar caracteres peligrosos para SQL y caracteres especiales
  // Reemplazar comillas simples por comillas dobles para evitar SQL injection
  textoLimpio = textoLimpio.replace(/'/g, "''")

  // Eliminar caracteres de control y caracteres no imprimibles
  textoLimpio = textoLimpio.replace(/[\x00-\x1F\x7F]/g, "")

  // Eliminar secuencias peligrosas de SQL
  const sqlPatterns = [
    /--/g, // Comentarios SQL
    /;/g, // Separador de comandos SQL
    /\/\*/g, // Inicio de comentario multilinea
    /\*\//g, // Fin de comentario multilinea
    /xp_/gi, // Procedimientos extendidos
    /sp_/gi, // Procedimientos del sistema
  ]

  sqlPatterns.forEach((pattern) => {
    textoLimpio = textoLimpio.replace(pattern, "")
  })

  // Eliminar palabras clave peligrosas de SQL (case insensitive)
  const sqlKeywords = [
    /\bDROP\b/gi,
    /\bDELETE\b/gi,
    /\bTRUNCATE\b/gi,
    /\bEXEC\b/gi,
    /\bEXECUTE\b/gi,
    /\bSCRIPT\b/gi,
    /\bUNION\b/gi,
    /\bINSERT\b/gi,
    /\bUPDATE\b/gi,
  ]

  sqlKeywords.forEach((keyword) => {
    textoLimpio = textoLimpio.replace(keyword, "")
  })

  return textoLimpio
}

/* ==================================================
  Funciones: Encryption
================================================== */
// Función: Encrypt - (Crypto-js)
export async function Encrypt(texto: string): Promise<string> {
  try {
    return encryptData(texto)
  } catch (error) {
    console.error("Error encrypting text:", error)
    throw new Error("Failed to encrypt text")
  }
}

// Función: Desencrypt - (Crypto-js)
export async function Desencrypt(textoEncriptado: string): Promise<string> {
  try {
    return decryptData(textoEncriptado)
  } catch (error) {
    console.error("Error decrypting text:", error)
    throw new Error("Failed to decrypt text")
  }
}

// Función: HashData - (Bcrypt-js) : Hashear o encriptar texto, utilizado para contraseñas
export async function HashData(texto: string): Promise<string> {
  try {
    return bcrypt.hash(texto, 10)
  } catch (error) {
    console.error("Error en actions/utilerias en HashData, hashing text:", error)
    throw new Error("Failed to hash text")
  }
}

// Función: CompareHash - (Bcrypt-js) : Comparar texto con hash, utilizado para contraseñas
export async function CompareHash(texto: string, hash: string): Promise<boolean> {
  try {
    const result = await bcrypt.compare(texto, hash)
    console.log("compare: " + result)
    return result
  } catch (error) {
    console.error("Error en actions/utilerias en CompareHash:", error)
    throw new Error("Failed to compare hash")
  }
}
