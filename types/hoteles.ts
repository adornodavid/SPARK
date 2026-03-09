/* ==================================================
* Types especiales:
  - Json

* Objetos:
    - oHotel
    - oSession

  * Especiales:
================================================== */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
  
// oHotel
export interface oHotel {
  id: number | null
  hotelid: number | null
  acronimo: string | null
  nombre: string | null
  categoria: string | null
  telefono: string | null
  email: string | null
  website: string | null
  direccion: string | null
  paisid: number | null
  pais: string | null
  estadoid: number | null
  estado: string | null
  ciudadid: number | null
  ciudad: string | null
  codigopostal: string | null
  estrellas: string | null
  altitud: string | null
  longitud: string | null
  totalcuartos: string | null
  activoevento: boolean | null
  amenidades: Json | null
  activocentroconsumo: boolean | null
  imgurl: string | null
  activo: boolean | null
}
