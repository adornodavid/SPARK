/* ==================================================
  * Objetos:
    - oMontajeXSalon
    - oSalon

  * Especiales:
    - Json
================================================== */

// Types especiales
// Json
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// oMontajeXSalon
export interface oMontajeXSalon {
  id: number | null
  montajeid: number | null
  montaje: string | null
  descripcion: string | null
  costo: number | null
  fotos: Json | null
  capacidadminima: number | null
  capacidadmaxima: number | null
  longitud: number | null
  ancho: number | null
  altura: number | null
  m2: number | null
  activo: boolean | null
}

// oSalon
export interface oSalon {
  id: number | null
  nombre: string | null
  hotelid: number | null
  hotel: string | null
  descripcion: string | null
  longitud: number | null
  ancho: number | null
  altura: number | null
  aream2: number | null
  capacidadminima: number | null
  capacidadmaxima: number | null
  precioporhora: number | null
  preciopordia: number | null
  fotos: Json | null
  activo: boolean | null
  fechacreacion: Date | null
  fechaactualizacion: Date | null
  equipoincluido: Json | null
  videos: Json | null
  planos: Json | null
  renders: Json | null
  estacombinado: boolean | null
  saloncombinadoid: Json | null
  montajes: oMontajeXSalon[] | null
}
