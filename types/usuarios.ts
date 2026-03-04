/* ==================================================
  * CRUD:
    - oUsuario
    - oUsuarioCrear -> NO es necesario
    - oUsuarioActualizar -> NO es necesario
    - oUsuarioEliminar -> NO es necesario
    - oSession
    - oSessionCrear -> NO es necesario
    - oSessionActualizar -> NO es necesario
    - oSessionEliminar -> NO es necesario

  * Especiales:
================================================== */

/*-  CRUD -*/
// Usuario
export interface oUsuario {
  id: number | null
  nombrecompleto: string | null
  usuario: string | null
  email: string | null
  telefono: string | null
  imgurl: string | null
  rolid: number | null
  rol: string | null
  hotelesid: Array<{
    hotelid: number | null
  }> | null
  ultimoingreso: string | null
  fechacreacion: Date | null
  activo: boolean | null
}

// Session
export interface oSession {
  UsuarioId: string
  Email: string
  NombreCompleto: string
  RolId: string
  Rol: string
  Hoteles: string
  SesionActiva: boolean
}

export interface User {
  id: string
  email: string
  password_hash: string
  full_name: string
  phone: string | null
  role: "admin_principal" | "admin_general" | "vendedor_full" | "vendedor_banquetes"
  avatar_url: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}
