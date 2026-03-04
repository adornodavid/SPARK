/* ==================================================
  * Objetos:
    - oCalendario

  * Especiales:
    - Json
================================================== */

// Types especiales
// Json
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// oSalon
export interface oCalendario {
  id: number
  folio: string
  tipo: string
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
  horainicio: string
  horafin: string
  numeroinvitados: number
  estatus: string
  notas: string | null
  cotizadopor: number
  fechacreacion: string
  fechaactualizacion: string
}
