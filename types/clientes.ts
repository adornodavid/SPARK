export interface oClientes {
  id: number
  nombre: string | null
  apellidopaterno: string | null
  apellidomaterno: string | null
  email: string | null
  telefono: string | null
  celular: string | null
  direccion: string | null
  codigopostal: string | null
  ciudadid: number | null
  ciudad: string | null
  estadoid: number | null
  estado: string | null
  paisid: number | null
  pais: string | null
  tipo: string | null
  fuente: string | null
  asignadoa: number | null
  compañiaid: number | null
  compañia: string | null
  preferred_contact: string | null
  preferenciasdecontacto: any | null // jsonb type
  notas: string | null
  fechacreacion: string | null // timestamp with time zone
  fechamodificacion: string | null // timestamp with time zone
}
