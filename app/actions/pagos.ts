"use server"

/* ==================================================
  Pagos — Sistema de comprobantes de pago y confirmacion
  Fase 6 — SPARK Portal Comercial & Banquetes MGHM

  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - subirComprobantePago / uploadComprobantePago

  * SELECTS: READ/OBTENER/SELECT
    - obtenerComprobantesPago / selComprobantesPago

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarComprobantePago / delComprobantePago

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - confirmarPago / confirmPago
    - confirmarReservacion / confirmReservacion
    - liberarFechasVencidas / releaseExpiredDates
    - verificarConflictoPago / checkPaymentConflict
================================================== */

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
  Types
================================================== */
export interface ComprobantePago {
  id: string
  cotizacionId: number
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  storagePath: string
  fechaSubida: string
}

/* ==================================================
  INSERTS: CREATE / CREAR / INSERT
================================================== */

/**
 * subirComprobantePago — Sube un comprobante de pago a Supabase Storage
 * y registra los metadatos en la cotizacion (campo comprobantespago JSON).
 *
 * Storage path: pagos/{cotizacionId}/{filename}
 * Allowed types: pdf, jpg, jpeg, png
 * Max size: 10MB
 */
export async function subirComprobantePago(
  cotizacionId: number,
  formData: FormData,
): Promise<{ success: boolean; error: string; data: ComprobantePago | null }> {
  try {
    const file = formData.get("file") as File

    if (!file || file.size === 0) {
      return { success: false, error: "No se proporciono un archivo valido", data: null }
    }

    if (!cotizacionId || cotizacionId <= 0) {
      return { success: false, error: "ID de cotizacion invalido", data: null }
    }

    // Validar tipo de archivo
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ]
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Tipo de archivo no permitido. Solo se aceptan: PDF, JPG, JPEG, PNG",
        data: null,
      }
    }

    // Validar tamano: max 10MB
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: "El archivo excede el tamano maximo de 10MB",
        data: null,
      }
    }

    // Verificar que la cotizacion exista
    const { data: cotizacion, error: errCot } = await supabase
      .from("cotizaciones")
      .select("id, estatus, comprobantespago")
      .eq("id", cotizacionId)
      .maybeSingle()

    if (errCot || !cotizacion) {
      return { success: false, error: "Cotizacion no encontrada", data: null }
    }

    // Crear nombre unico para el archivo
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "bin"
    const timestamp = Date.now()
    const cleanName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .substring(0, 50)
    const fileName = `${cleanName}-${timestamp}.${fileExtension}`
    const storagePath = `pagos/${cotizacionId}/${fileName}`

    // Subir al bucket "spark"
    const { error: uploadError } = await supabase.storage
      .from("spark")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      return {
        success: false,
        error: "Error al subir el archivo: " + uploadError.message,
        data: null,
      }
    }

    // Obtener URL publica
    const { data: urlData } = supabase.storage.from("spark").getPublicUrl(storagePath)

    if (!urlData) {
      return { success: false, error: "No se pudo obtener la URL del archivo", data: null }
    }

    // Crear registro del comprobante
    const comprobante: ComprobantePago = {
      id: `pago-${timestamp}-${Math.random().toString(36).substring(2, 8)}`,
      cotizacionId,
      fileName: file.name,
      fileUrl: urlData.publicUrl,
      fileType: file.type,
      fileSize: file.size,
      storagePath,
      fechaSubida: new Date().toISOString(),
    }

    // Actualizar campo comprobantespago (JSON array) en la cotizacion
    const comprobantesExistentes: ComprobantePago[] = Array.isArray(cotizacion.comprobantespago)
      ? cotizacion.comprobantespago
      : []

    const comprobantesActualizados = [...comprobantesExistentes, comprobante]

    const { error: updateError } = await supabase
      .from("cotizaciones")
      .update({
        comprobantespago: comprobantesActualizados,
        fechaactualizacion: new Date().toISOString(),
      })
      .eq("id", cotizacionId)

    if (updateError) {
      // Si falla la actualizacion de BD, intentar eliminar el archivo subido
      await supabase.storage.from("spark").remove([storagePath])
      return {
        success: false,
        error: "Error al registrar comprobante en base de datos: " + updateError.message,
        data: null,
      }
    }

    revalidatePath(`/cotizaciones/${cotizacionId}`)
    revalidatePath("/cotizaciones")
    return { success: true, error: "", data: comprobante }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error al subir comprobante: " + errorMessage, data: null }
  }
}

/* ==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */

/**
 * obtenerComprobantesPago — Obtiene la lista de comprobantes de pago de una cotizacion
 */
export async function obtenerComprobantesPago(
  cotizacionId: number,
): Promise<{ success: boolean; error: string; data: ComprobantePago[] }> {
  try {
    const { data: cotizacion, error } = await supabase
      .from("cotizaciones")
      .select("comprobantespago")
      .eq("id", cotizacionId)
      .maybeSingle()

    if (error || !cotizacion) {
      return { success: false, error: "Cotizacion no encontrada", data: [] }
    }

    const comprobantes: ComprobantePago[] = Array.isArray(cotizacion.comprobantespago)
      ? cotizacion.comprobantespago
      : []

    return { success: true, error: "", data: comprobantes }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error: " + errorMessage, data: [] }
  }
}

/* ==================================================
  DELETES: DROP / ELIMINAR / DELETE
================================================== */

/**
 * eliminarComprobantePago — Elimina un comprobante de pago del storage y de la BD
 */
export async function eliminarComprobantePago(
  cotizacionId: number,
  comprobanteId: string,
): Promise<{ success: boolean; error: string }> {
  try {
    // Obtener comprobantes actuales
    const { data: cotizacion, error: errCot } = await supabase
      .from("cotizaciones")
      .select("comprobantespago")
      .eq("id", cotizacionId)
      .maybeSingle()

    if (errCot || !cotizacion) {
      return { success: false, error: "Cotizacion no encontrada" }
    }

    const comprobantes: ComprobantePago[] = Array.isArray(cotizacion.comprobantespago)
      ? cotizacion.comprobantespago
      : []

    const comprobante = comprobantes.find((c) => c.id === comprobanteId)
    if (!comprobante) {
      return { success: false, error: "Comprobante no encontrado" }
    }

    // Eliminar del storage
    const { error: storageError } = await supabase.storage
      .from("spark")
      .remove([comprobante.storagePath])

    if (storageError) {
      return { success: false, error: "Error al eliminar archivo del storage: " + storageError.message }
    }

    // Actualizar BD: remover el comprobante del array
    const comprobantesActualizados = comprobantes.filter((c) => c.id !== comprobanteId)

    const { error: updateError } = await supabase
      .from("cotizaciones")
      .update({
        comprobantespago: comprobantesActualizados.length > 0 ? comprobantesActualizados : null,
        fechaactualizacion: new Date().toISOString(),
      })
      .eq("id", cotizacionId)

    if (updateError) {
      return { success: false, error: "Error al actualizar base de datos: " + updateError.message }
    }

    revalidatePath(`/cotizaciones/${cotizacionId}`)
    revalidatePath("/cotizaciones")
    return { success: true, error: "" }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error: " + errorMessage }
  }
}

/* ==================================================
  SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */

/**
 * verificarConflictoPago — Verifica si hay otra cotizacion para el mismo salon+fecha
 * que podria tener prioridad de pago.
 */
export async function verificarConflictoPago(
  cotizacionId: number,
): Promise<{
  success: boolean
  error: string
  hayConflicto: boolean
  conflictos: Array<{
    id: number
    folio: string
    nombreevento: string
    estatus: string
    tieneComprobante: boolean
  }>
}> {
  try {
    // Obtener datos de la cotizacion actual
    const { data: cotizacion, error: errCot } = await supabase
      .from("cotizaciones")
      .select("id, salonid, fechainicio, estatus")
      .eq("id", cotizacionId)
      .maybeSingle()

    if (errCot || !cotizacion) {
      return { success: false, error: "Cotizacion no encontrada", hayConflicto: false, conflictos: [] }
    }

    // Buscar otras cotizaciones con el mismo salon y fecha
    const { data: otrasCotz, error: errOtras } = await supabase
      .from("cotizaciones")
      .select("id, folio, nombreevento, estatus, comprobantespago")
      .eq("salonid", cotizacion.salonid)
      .eq("fechainicio", cotizacion.fechainicio)
      .eq("activo", true)
      .neq("id", cotizacionId)
      .neq("estatus", "Cancelada")
      .neq("estatus", "Vencida")

    if (errOtras) {
      return { success: false, error: "Error buscando conflictos: " + errOtras.message, hayConflicto: false, conflictos: [] }
    }

    const conflictos = (otrasCotz || []).map((c) => ({
      id: c.id,
      folio: c.folio,
      nombreevento: c.nombreevento,
      estatus: c.estatus,
      tieneComprobante: Array.isArray(c.comprobantespago) && c.comprobantespago.length > 0,
    }))

    return {
      success: true,
      error: "",
      hayConflicto: conflictos.length > 0,
      conflictos,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error: " + errorMessage, hayConflicto: false, conflictos: [] }
  }
}

/**
 * confirmarPago — Cambia el estatus de la cotizacion a "Pagada"
 * Implementa la regla de prioridad de pago:
 * - Si hay 2+ cotizaciones para mismo salon+fecha, la primera que paga tiene prioridad
 * - Las demas se marcan con nota de "En Espera"
 */
export async function confirmarPago(
  cotizacionId: number,
): Promise<{ success: boolean; error: string; advertencias: string[] }> {
  try {
    const advertencias: string[] = []

    // Obtener cotizacion actual
    const { data: cotizacion, error: errCot } = await supabase
      .from("cotizaciones")
      .select("id, folio, salonid, fechainicio, estatus, comprobantespago")
      .eq("id", cotizacionId)
      .maybeSingle()

    if (errCot || !cotizacion) {
      return { success: false, error: "Cotizacion no encontrada", advertencias: [] }
    }

    // Validar que el estatus actual permita cambiar a Pagada
    const estatusPermitidos = ["Enviada", "Aceptada"]
    if (!estatusPermitidos.includes(cotizacion.estatus)) {
      return {
        success: false,
        error: `No se puede marcar como Pagada desde el estatus "${cotizacion.estatus}". Solo se permite desde: ${estatusPermitidos.join(", ")}`,
        advertencias: [],
      }
    }

    // Validar que tenga al menos un comprobante de pago
    const comprobantes = Array.isArray(cotizacion.comprobantespago) ? cotizacion.comprobantespago : []
    if (comprobantes.length === 0) {
      return {
        success: false,
        error: "Se requiere al menos un comprobante de pago para marcar como Pagada",
        advertencias: [],
      }
    }

    // Verificar regla de prioridad de pago: buscar cotizaciones conflicto
    const { data: conflictos } = await supabase
      .from("cotizaciones")
      .select("id, folio, nombreevento, estatus, comprobantespago")
      .eq("salonid", cotizacion.salonid)
      .eq("fechainicio", cotizacion.fechainicio)
      .eq("activo", true)
      .neq("id", cotizacionId)
      .neq("estatus", "Cancelada")
      .neq("estatus", "Vencida")

    if (conflictos && conflictos.length > 0) {
      // Verificar si alguna ya esta Pagada o Confirmada (tiene prioridad)
      const cotizacionesPrioritarias = conflictos.filter(
        (c) => c.estatus === "Pagada" || c.estatus === "Confirmada" || c.estatus === "Realizada",
      )

      if (cotizacionesPrioritarias.length > 0) {
        const folios = cotizacionesPrioritarias.map((c) => c.folio).join(", ")
        return {
          success: false,
          error: `No se puede confirmar pago: ya existe otra cotizacion con pago confirmado para la misma fecha y salon (${folios}). Esta cotizacion queda En Espera.`,
          advertencias: [],
        }
      }

      // Si hay otras cotizaciones pero ninguna Pagada, esta tiene prioridad (primera en pagar)
      // Notificar que las otras quedan en espera
      for (const conflicto of conflictos) {
        advertencias.push(
          `La cotizacion ${conflicto.folio} (${conflicto.nombreevento}) queda en espera para la misma fecha y salon.`,
        )

        // Agregar nota interna a las cotizaciones en conflicto
        await supabase
          .from("cotizaciones")
          .update({
            notas: `[SISTEMA] En espera - La cotizacion ${cotizacion.folio} tiene prioridad de pago para esta fecha y salon. ${new Date().toLocaleDateString("es-MX")}`,
            fechaactualizacion: new Date().toISOString(),
          })
          .eq("id", conflicto.id)
      }
    }

    // Cambiar estatus a Pagada
    const { error: updateError } = await supabase
      .from("cotizaciones")
      .update({
        estatus: "Pagada",
        fechaactualizacion: new Date().toISOString(),
      })
      .eq("id", cotizacionId)

    if (updateError) {
      return { success: false, error: "Error al actualizar estatus: " + updateError.message, advertencias: [] }
    }

    revalidatePath(`/cotizaciones/${cotizacionId}`)
    revalidatePath("/cotizaciones")
    return { success: true, error: "", advertencias }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error: " + errorMessage, advertencias: [] }
  }
}

/**
 * confirmarReservacion — Cambia el estatus de la cotizacion a "Confirmada"
 * y crea un registro en la tabla reservaciones.
 */
export async function confirmarReservacion(
  cotizacionId: number,
): Promise<{ success: boolean; error: string; reservacionId: number | null }> {
  try {
    // Obtener datos completos de la cotizacion
    const { data: cotizacion, error: errCot } = await supabase
      .from("vw_ocotizaciones")
      .select("*")
      .eq("id", cotizacionId)
      .maybeSingle()

    if (errCot || !cotizacion) {
      return { success: false, error: "Cotizacion no encontrada", reservacionId: null }
    }

    // Validar estatus
    if (cotizacion.estatus !== "Pagada") {
      return {
        success: false,
        error: `Solo se puede confirmar una reservacion desde el estatus "Pagada". Estatus actual: "${cotizacion.estatus}"`,
        reservacionId: null,
      }
    }

    // Crear registro en reservaciones
    // NOTA: Asegurar que la tabla reservaciones tenga las columnas:
    //   cotizacionid (int, nullable, FK a cotizaciones.id)
    //   tipoevento (text, nullable)
    // Si no existen, se omiten del insert
    const reservacionData: Record<string, unknown> = {
      nombreevento: cotizacion.nombreevento,
      hotelid: cotizacion.hotelid,
      salonid: cotizacion.salonid,
      montajeid: cotizacion.montajeid,
      clienteid: cotizacion.clienteid,
      fechainicio: cotizacion.fechainicio,
      fechafin: cotizacion.fechafin || cotizacion.fechainicio,
      horainicio: cotizacion.horainicio,
      horafin: cotizacion.horafin,
      numeroinvitados: cotizacion.numeroinvitados,
      subtotal: cotizacion.subtotal,
      impuestos: cotizacion.impuestos,
      totalmonto: cotizacion.totalmonto,
      estatus: "Confirmada",
      estatusdepago: "Pagada",
      notas: `Reservacion creada desde cotizacion ${cotizacion.folio || cotizacionId}. ${cotizacion.notas || ""}`.trim(),
      fechaconfirmacion: new Date().toISOString().split("T")[0],
      fechacreacion: new Date().toISOString(),
      activo: true,
    }

    // Intentar insertar con campos opcionales (cotizacionid, tipoevento)
    // Si esas columnas no existen en DB, reintentar sin ellas
    reservacionData.cotizacionid = cotizacionId
    reservacionData.tipoevento = cotizacion.tipoevento

    let reservacion: { id: number } | null = null

    const { data: resData, error: errRes } = await supabase
      .from("reservaciones")
      .insert(reservacionData)
      .select("id")
      .maybeSingle()

    if (errRes) {
      // Si el error es por columnas inexistentes, reintentar sin ellas
      if (errRes.message.includes("cotizacionid") || errRes.message.includes("tipoevento")) {
        delete reservacionData.cotizacionid
        delete reservacionData.tipoevento

        const { data: resData2, error: errRes2 } = await supabase
          .from("reservaciones")
          .insert(reservacionData)
          .select("id")
          .maybeSingle()

        if (errRes2) {
          return {
            success: false,
            error: "Error al crear reservacion: " + errRes2.message,
            reservacionId: null,
          }
        }
        reservacion = resData2
      } else {
        return {
          success: false,
          error: "Error al crear reservacion: " + errRes.message,
          reservacionId: null,
        }
      }
    } else {
      reservacion = resData
    }

    // Actualizar cotizacion a Confirmada
    const { error: updateError } = await supabase
      .from("cotizaciones")
      .update({
        estatus: "Confirmada",
        fechaactualizacion: new Date().toISOString(),
      })
      .eq("id", cotizacionId)

    if (updateError) {
      return {
        success: false,
        error: "Error al actualizar cotizacion: " + updateError.message,
        reservacionId: reservacion?.id || null,
      }
    }

    revalidatePath(`/cotizaciones/${cotizacionId}`)
    revalidatePath("/cotizaciones")
    revalidatePath("/reservaciones")
    return { success: true, error: "", reservacionId: reservacion?.id || null }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error: " + errorMessage, reservacionId: null }
  }
}

/**
 * liberarFechasVencidas — Busca cotizaciones con vigencia expirada
 * y cambia su estatus a "Vencida", liberando las fechas.
 *
 * Se puede llamar desde un cron job (Vercel Cron) o manualmente.
 */
export async function liberarFechasVencidas(): Promise<{
  success: boolean
  error: string
  liberadas: number
  detalles: Array<{ id: number; folio: string; validohasta: string }>
}> {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyStr = hoy.toISOString().split("T")[0]

    // Buscar cotizaciones vencidas: vigencia expirada y estatus Enviada o Aceptada
    const { data: vencidas, error } = await supabase
      .from("cotizaciones")
      .select("id, folio, validohasta, estatus")
      .eq("activo", true)
      .in("estatus", ["Enviada", "Aceptada"])
      .not("validohasta", "is", null)
      .lt("validohasta", hoyStr)

    if (error) {
      return {
        success: false,
        error: "Error buscando cotizaciones vencidas: " + error.message,
        liberadas: 0,
        detalles: [],
      }
    }

    if (!vencidas || vencidas.length === 0) {
      return {
        success: true,
        error: "",
        liberadas: 0,
        detalles: [],
      }
    }

    const ids = vencidas.map((v) => v.id)

    // Actualizar todas a estatus "Vencida"
    const { error: updateError } = await supabase
      .from("cotizaciones")
      .update({
        estatus: "Vencida",
        fechaactualizacion: new Date().toISOString(),
      })
      .in("id", ids)

    if (updateError) {
      return {
        success: false,
        error: "Error al actualizar cotizaciones vencidas: " + updateError.message,
        liberadas: 0,
        detalles: [],
      }
    }

    const detalles = vencidas.map((v) => ({
      id: v.id,
      folio: v.folio,
      validohasta: v.validohasta,
    }))

    // Log de la accion
    console.log(
      `[SPARK] liberarFechasVencidas: ${detalles.length} cotizaciones vencidas liberadas - ${hoyStr}`,
      detalles.map((d) => d.folio).join(", "),
    )

    revalidatePath("/cotizaciones")
    return {
      success: true,
      error: "",
      liberadas: detalles.length,
      detalles,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error: " + errorMessage, liberadas: 0, detalles: [] }
  }
}
