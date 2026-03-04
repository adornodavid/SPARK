/* ==================================================
  * Objetos:
    - oCotizacion

  * Especiales:
    - Json
================================================== */

// Types especiales
// Json
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// oCotizacion
export interface oCotizacion {
  id: number
  folio: string
  hotelid: number
  hotel: string
  salonid: number
  salon: string
  montajeid: number
  montaje: string
  clienteid: number
  cliente: string
  nombreevento: string
  tipoevento: string
  horainicio: string
  horafin: string
  numeroinvitados: number
  estatus: string
  subtotal: string
  impuestos: string
  totalmonto: string
  porcentajedescuento: string
  montodescuento: string
  notas: string | null
  validohasta: string
  cotizadopor: number
  fechaactualizacion: string
  fechacreacion: string
  fechainicio: string
  fechafin: string
}
