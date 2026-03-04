/* ==================================================
  * Objetos:
    - oReservacion

  * Especiales:
    - Json
================================================== */

// Types especiales
// Json
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// oReservacion
export interface oReservacion {
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
  fechainicio: string
  fechafin: string
  horafin: string
  horainicio: string
  noches: number
  adultos: number
  menores: number
  numeroinvitados: number
  estatus: string
  estatusdepago: string
  subtotal: string
  impuestos: string
  totalmonto: string
  montopagado: string
  solicitudesespeciales: string | null
  notas: string | null
  notasinternas: string | null
  creadopor: number
  fechaconfirmacion: string
  fechacancelacion: string | null
  motivocancelacion: string | null
  fechacreacion: string
  fechaactualizacion: string
}
