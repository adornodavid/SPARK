"use server"

/* ==================================================
  Imports
================================================== */
import { createClient } from "@supabase/supabase-js"
import type { oClientes } from "@/types/clientes"
import type { ddlItem } from "@/types/common"
import { revalidatePath } from "next/cache"

/* ==================================================
  Conexion a la base de datos: Supabase
================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* ==================================================
	  --------------------
  Objetos / Clases
  --------------------
  * Objetos
    - objetoCliente / oCliente (Individual)
    - objetoClientes / oClientes (Listado / Array)
  
  --------------------
  Funciones
  --------------------
  * INSERTS: CREATE/CREAR/INSERT
    - crearCliente / insCliente

  * SELECTS: READ/OBTENER/SELECT
    - obtenerClientes / selClientes

  * UPDATES: EDIT/ACTUALIZAR/UPDATE
    - actualizarCliente / updCliente

  * DELETES: DROP/ELIMINAR/DELETE
    - eliminarCliente / delCliente

  * SPECIALS: PROCESS/ESPECIAL/SPECIAL
    - listaDesplegableClientes / ddlClientes
================================================== */

/*==================================================
    OBJETOS / CLASES
================================================== */
// Función: objetoCliente / oCliente (Individual): Esta Función crea de manera individual un objeto/clase
export async function objetoCliente(
  id = -1,
  nombre = "",
  apellidopaterno = "",
  email = "",
  telefono = "",
  compañiaid = -1,
): Promise<{ success: boolean; error: string; data: oClientes | null }> {
  try {
    let query = supabase.from("clientes").select("*").eq("activo", true)

    // Agregar filtros condicionales
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (apellidopaterno !== "") {
      query = query.ilike("apellidopaterno", `%${apellidopaterno}%`)
    }
    if (email !== "") {
      query = query.ilike("email", `%${email}%`)
    }
    if (telefono !== "") {
      query = query.ilike("telefono", `%${telefono}%`)
    }
    if (compañiaid !== -1) {
      query = query.eq("compañiaid", compañiaid)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      return {
        success: false,
        error: "Error en la funcion objetoCliente de actions/clientes: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oClientes }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoCliente: " + errorMessage, data: null }
  }
}

// Función: objetoClientes / oClientes (Listado): Esta Función crea un listado de objetos/clases, es un array
export async function objetoClientes(
  nombre = "",
  apellidopaterno = "",
  email = "",
  telefono = "",
  compañiaid = -1,
  tipo = "",
): Promise<{ success: boolean; error: string; data: oClientes[] | null }> {
  try {
    let query = supabase.from("vw_oclientes").select("*")

    // Agregar filtros condicionales
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (apellidopaterno !== "") {
      query = query.ilike("apellidopaterno", `%${apellidopaterno}%`)
    }
    if (email !== "") {
      query = query.ilike("email", `%${email}%`)
    }
    if (telefono !== "") {
      query = query.ilike("telefono", `%${telefono}%`)
    }
    if (compañiaid !== -1) {
      query = query.eq("compañiaid", compañiaid)
    }
    if (tipo !== "") {
      query = query.ilike("tipo", `%${tipo}%`)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en la funcion objetoClientes de actions/clientes: " + error.message,
        data: null,
      }
    }

    return { success: true, error: "", data: data as oClientes[] }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion objetoClientes: " + errorMessage, data: null }
  }
}
/*==================================================
    INSERTS: CREATE / CREAR / INSERT
================================================== */
// Función: crearCliente / insCliente: Función para insertar
export async function crearCliente(formData: FormData) {
  try {
    // Paso 1: Pasar los datos del formData a variables con su tipo de dato
    const nombre = formData.get("nombre") as string
    const apellidopaterno = formData.get("apellidopaterno") as string
    const apellidomaterno = formData.get("apellidomaterno") as string
    const email = formData.get("email") as string
    const telefono = formData.get("telefono") as string
    const celular = formData.get("celular") as string
    const direccion = formData.get("direccion") as string
    const codigopostal = formData.get("codigopostal") as string
    const ciudadid = formData.get("ciudadid") ? Number.parseInt(formData.get("ciudadid") as string) : null
    const estadoid = formData.get("estadoid") ? Number.parseInt(formData.get("estadoid") as string) : null
    const paisid = formData.get("paisid") ? Number.parseInt(formData.get("paisid") as string) : null
    const tipo = formData.get("tipo") as string
    const fuente = formData.get("fuente") as string
    const asignadoa = formData.get("asignadoa") ? Number.parseInt(formData.get("asignadoa") as string) : null
    const compañiaid = formData.get("compañiaid") ? Number.parseInt(formData.get("compañiaid") as string) : null
    const preferred_contact = formData.get("preferred_contact") as string
    const notas = formData.get("notas") as string
    const fecha = new Date().toISOString()

    if (!nombre || nombre.trim() === "") {
      return { success: false, error: "El nombre es requerido" }
    }
    if (!email || email.trim() === "") {
      return { success: false, error: "El email es requerido" }
    }

    // Paso 2: Validar si existe antes de proceder
    const { data: clienteExistente, error: errorValidacion } = await supabase
      .from("vw_oclientes")
      .select("*")
      .or(`email.eq.${email}`)
      .maybeSingle()

    if (errorValidacion) {
      return {
        success: false,
        error: "Error al validar cliente existente en la funcion crearCliente: " + errorValidacion.message,
      }
    }

    if (clienteExistente) {
      return {
        success: false,
        error:
          "Ya existe un cliente con el mismo email, el proceso de la función crearCliente se cancelo, favor de verificar.",
      }
    }

    // Paso 3: Ejecutar query de INSERT
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nombre,
        apellidopaterno,
        apellidomaterno,
        email,
        telefono,
        celular,
        direccion,
        codigopostal,
        ciudadid,
        estadoid,
        paisid,
        tipo,
        fuente,
        asignadoa,
        compañiaid,
        preferred_contact,
        notas,
        fechacreacion: fecha,
        fechamodificacion: fecha,
      })
      .select("id")
      .single()

    if (error) {
      return { success: false, error: "Error al crear cliente: " + error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del cliente creado en la funcion crearCliente" }
    }

    revalidatePath("/clientes")

    // Paso 4: Regresar resultado
    return { success: true, data: data.id }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en actions/clientes en la funcion crearCliente: " + errorMessage }
  }
}

/*==================================================
  SELECTS: READ / OBTENER / SELECT
================================================== */
// Función: obtenerClientes / selClientes: Función para obtener
export async function obtenerClientes(
  id = -1,
  nombre = "",
  apellidopaterno = "",
  email = "",
  telefono = "",
  tipo = "",
  compañiaid = -1,
): Promise<{ success: boolean; error: string; data: unknown }> {
  try {
    // Query principal
    let query = supabase.from("vw_oclientes").select("*")

    // Filtros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (nombre !== "") {
      query = query.ilike("nombre", `%${nombre}%`)
    }
    if (apellidopaterno !== "") {
      query = query.ilike("apellidopaterno", `%${apellidopaterno}%`)
    }
    if (email !== "") {
      query = query.ilike("email", `%${email}%`)
    }
    if (telefono !== "") {
      query = query.ilike("telefono", `%${telefono}%`)
    }
    if (tipo !== "") {
      query = query.ilike("tipo", `%${tipo}%`)
    }
    if (compañiaid !== -1) {
      query = query.eq("compañiaid", compañiaid)
    }

    // Ejecutar query
    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: "Error en la funcion obtenerClientes de actions/clientes: " + error.message,
        data: null,
      }
    }

    // Regreso de data
    return { success: true, error: "", data: data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error en funcion obtenerClientes: " + errorMessage, data: null }
  }
}

/*==================================================
  UPDATES: EDIT / ACTUALIZAR / UPDATE
================================================== */
// Función: actualizarCliente / updCliente: Función para actualizar
export async function actualizarCliente(formData: FormData) {
  try {
    // Paso 1: Recibir variables
    const idString = formData.get("id") as string
    const id = Number(idString)
    const nombre = formData.get("nombre") as string
    const apellidopaterno = formData.get("apellidopaterno") as string
    const apellidomaterno = formData.get("apellidomaterno") as string
    const email = formData.get("email") as string
    const telefono = formData.get("telefono") as string
    const celular = formData.get("celular") as string
    const direccion = formData.get("direccion") as string
    const codigopostal = formData.get("codigopostal") as string
    const ciudadid = formData.get("ciudadid") ? Number.parseInt(formData.get("ciudadid") as string) : null
    const estadoid = formData.get("estadoid") ? Number.parseInt(formData.get("estadoid") as string) : null
    const paisid = formData.get("paisid") ? Number.parseInt(formData.get("paisid") as string) : null
    const tipo = formData.get("tipo") as string
    const fuente = formData.get("fuente") as string
    const asignadoa = formData.get("asignadoa") ? Number.parseInt(formData.get("asignadoa") as string) : null
    const compañiaid = formData.get("compañiaid") ? Number.parseInt(formData.get("compañiaid") as string) : null
    const preferred_contact = formData.get("preferred_contact") as string
    const notas = formData.get("notas") as string
    const fecha = new Date().toISOString()

    // Paso 2: Validar variables obligatorias
    if (!nombre || nombre.length < 2) {
      return { success: false, error: "El parametro nombre, esta incompleto. Favor de verificar." }
    }
    if (!email || email.length < 3) {
      return { success: false, error: "El parametro email, esta incompleto. Favor de verificar." }
    }

    const { data: clienteExistente, error: errorExistencia } = await supabase
      .from("clientes")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (errorExistencia) {
      return { success: false, error: "Error validando existencia del cliente: " + errorExistencia.message }
    }

    if (!clienteExistente) {
      return { success: false, error: "El cliente con el id proporcionado no existe" }
    }

    const { data: duplicado, error: errorDuplicado } = await supabase
      .from("vw_oclientes")
      .select("*")
      .or(`email.eq.${email}`)
      .neq("id", id)
      .maybeSingle()

    if (errorDuplicado) {
      return { success: false, error: "Error al validar duplicados: " + errorDuplicado.message }
    }

    if (duplicado) {
      return {
        success: false,
        error: "Ya existe otro cliente con el mismo email",
      }
    }

    const updateData: any = {
      nombre,
      apellidopaterno,
      apellidomaterno,
      email,
      telefono,
      celular,
      direccion,
      codigopostal,
      ciudadid,
      estadoid,
      paisid,
      tipo,
      fuente,
      asignadoa,
      compañiaid,
      preferred_contact,
      notas,
      fechamodificacion: fecha,
    }

    // Paso 3: Ejecutar Query
    const { data, error } = await supabase.from("clientes").update(updateData).eq("id", id).select("id").single()

    // Return error
    if (error) {
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "No se pudo obtener el ID del cliente actualizado" }
    }

    revalidatePath("/clientes")

    // Retorno de datos
    return { success: true, data: data.id }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false,
      error: "Error interno del servidor, al ejecutar actualizarCliente de actions/clientes: " + errorMessage,
    }
  }
}

/*==================================================
  * DELETES: DROP / ELIMINAR / DELETE
================================================== */
// Función: eliminarCliente / delCliente: Función para eliminar

/*==================================================
  * SPECIALS: PROCESS / ESPECIAL / SPECIAL
================================================== */
// Función: listaDesplegableClientes / ddlClientes: Función que se utiliza para los dropdownlist
export async function listaDesplegableClientes(id = -1, descripcion = "") {
  try {
    // Query principal
    let query = supabase.from("clientes").select("id, nombre, apellidopaterno, apellidomaterno, email, telefono").eq("activo", true)

    // Filtros en query, dependiendo parametros
    if (id !== -1) {
      query = query.eq("id", id)
    }
    if (descripcion !== "") {
      query = query.or(
        `nombre.ilike.%${descripcion}%,apellidopaterno.ilike.%${descripcion}%,apellidomaterno.ilike.%${descripcion}%`,
      )
    }

    query = query.order("nombre", { ascending: true }).limit(100)

    // Variables y resultados del query
    const { data: clientes, error } = await query

    if (error) {
      return { success: false, error: "Error obteniendo lista de clientes: " + error.message }
    }

    if (!clientes || clientes.length === 0) {
      return { success: true, data: [] }
    }

    const data = clientes.map((cliente) => ({
      value: cliente.id.toString(),
      text: `${cliente.nombre} ${cliente.apellidopaterno || ""} ${cliente.apellidomaterno || ""}`.trim(),
      email: cliente.email || "",
      telefono: cliente.telefono || "",
    }))

    return { success: true, data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo lista desplegable de clientes: " + errorMessage }
  }
}

/* ==================================================
  Integración Pipedrive → Clientes
================================================== */

/**
 * Inserta en clientes todos los registros de pip_persons que aún no existan
 * (comparando por pipedrive_id). Invoca la función SQL transferir_nuevos_pip_a_clientes.
 */
export async function transferirNuevosDesdePipedrive() {
  try {
    const { data, error } = await supabase.rpc("transferir_nuevos_pip_a_clientes")
    if (error) return { success: false, error: error.message }
    const row = Array.isArray(data) ? data[0] : data
    revalidatePath("/clientes")
    return {
      success: true,
      insertados: row?.insertados ?? 0,
      skipeados_dup: row?.skipeados_dup ?? 0,
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error transfiriendo desde Pipedrive: " + msg }
  }
}

/**
 * Actualiza los clientes existentes (con pipedrive_id) con datos frescos de
 * pip_persons. Campos actualizados: nombre, apellidos, email (primary),
 * telefono (primary), puesto, pipedrive_pais/estado/ciudad/organizacionid/
 * correos/telefonos/codigopostal/direccion/tipo_contacto.
 */
export async function actualizarClientesDesdePipedrive() {
  try {
    const { data, error } = await supabase.rpc("actualizar_clientes_desde_pip_persons")
    if (error) return { success: false, error: error.message }
    const row = Array.isArray(data) ? data[0] : data
    revalidatePath("/clientes")
    return { success: true, actualizados: row?.actualizados ?? 0 }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error actualizando clientes desde pip_persons: " + msg }
  }
}

/**
 * Obtiene un cliente por id junto con el registro de pip_persons que coincida
 * por pipedrive_id (si existe).
 */
export async function obtenerClienteConPipedrive(id: number) {
  try {
    const { data: cliente, error: e1 } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (e1) return { success: false, error: e1.message }
    if (!cliente) return { success: false, error: "Cliente no encontrado" }

    let pipPerson: Record<string, unknown> | null = null
    if (cliente.pipedrive_id) {
      const { data: pip } = await supabase
        .from("pip_persons")
        .select("*")
        .eq("pipedrive_id", cliente.pipedrive_id)
        .maybeSingle()
      if (pip) pipPerson = pip
    }

    // Resolver nombres desde catálogos
    const [empresaRes, paisRes, estadoRes, ciudadRes] = await Promise.all([
      cliente.empresaid
        ? supabase.from("empresas").select("nombre").eq("id", cliente.empresaid).maybeSingle()
        : Promise.resolve({ data: null }),
      cliente.paisid
        ? supabase.from("paises").select("descripcion").eq("id", cliente.paisid).maybeSingle()
        : Promise.resolve({ data: null }),
      cliente.estadoid
        ? supabase.from("estados").select("descripcion").eq("id", cliente.estadoid).maybeSingle()
        : Promise.resolve({ data: null }),
      cliente.ciudadid
        ? supabase.from("ciudades").select("descripcion").eq("id", cliente.ciudadid).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const lookups = {
      empresa: (empresaRes.data as { nombre?: string } | null)?.nombre ?? null,
      pais: (paisRes.data as { descripcion?: string } | null)?.descripcion ?? null,
      estado: (estadoRes.data as { descripcion?: string } | null)?.descripcion ?? null,
      ciudad: (ciudadRes.data as { descripcion?: string } | null)?.descripcion ?? null,
    }

    return { success: true, cliente, pipPerson, lookups }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo cliente: " + msg }
  }
}

/**
 * Actualiza los campos editables de un cliente (id→fuente) con validaciones:
 * - nombre no vacío
 * - email y/o telefono: al menos uno
 * - email único (excepto este cliente), telefono único (excepto este cliente)
 */
export type ClienteEditPayload = {
  tipo: string | null
  empresaid: number | null
  nombre: string
  apellidos: string | null
  email: string | null
  telefono: string | null
  direccion: string | null
  paisid: number | null
  estadoid: number | null
  ciudadid: number | null
  codigopostal: string | null
  fuente: string | null
}

export async function actualizarClienteBasico(id: number, data: ClienteEditPayload) {
  try {
    const nombre = (data.nombre ?? "").trim()
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }

    const email = (data.email ?? "").trim().toLowerCase() || null
    const telefono = (data.telefono ?? "").trim() || null
    if (!email && !telefono) {
      return { success: false, error: "Debe proporcionar al menos un email o un teléfono." }
    }

    // Unicidad email (case-insensitive) excluyendo este cliente
    if (email) {
      const { data: dupEmail, error: eE } = await supabase
        .from("clientes")
        .select("id")
        .ilike("email", email)
        .neq("id", id)
        .limit(1)
        .maybeSingle()
      if (eE) return { success: false, error: eE.message }
      if (dupEmail) return { success: false, error: `Ya existe otro cliente con el email "${email}".` }
    }

    // Unicidad telefono excluyendo este cliente
    if (telefono) {
      const { data: dupTel, error: eT } = await supabase
        .from("clientes")
        .select("id")
        .eq("telefono", telefono)
        .neq("id", id)
        .limit(1)
        .maybeSingle()
      if (eT) return { success: false, error: eT.message }
      if (dupTel) return { success: false, error: `Ya existe otro cliente con el teléfono "${telefono}".` }
    }

    const { error } = await supabase
      .from("clientes")
      .update({
        tipo: data.tipo,
        empresaid: data.empresaid,
        nombre,
        apellidos: (data.apellidos ?? "").trim() || null,
        email,
        telefono: telefono ? telefono.slice(0, 20) : null,
        direccion: (data.direccion ?? "").trim() || null,
        paisid: data.paisid,
        estadoid: data.estadoid,
        ciudadid: data.ciudadid,
        codigopostal: (data.codigopostal ?? "").trim() || null,
        fuente: data.fuente,
        fechamodificacion: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) return { success: false, error: error.message }
    revalidatePath("/clientes")
    revalidatePath(`/clientes/ver/${id}`)
    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error actualizando cliente: " + msg }
  }
}

/**
 * Alta de cliente nuevo desde /clientes/new. Devuelve el id insertado.
 */
export type CrearClientePayload = {
  nombre: string
  apellidos: string
  tipo: "Individual" | "Empresa"
  empresaid: number | null
  email: string
  telefono: string
  puesto: string
  cumpleanos: string | null // YYYY-MM-DD (año 2000 como placeholder) o null
  paisid: number | null
  estadoid: number | null
  ciudadid: number | null
  codigopostal: string
  direccion: string
  preferenciaEmail: boolean
  preferenciaTelefono: boolean
  notas: string
}

export async function crearClienteNuevo(payload: CrearClientePayload) {
  try {
    const nombre = (payload.nombre || "").trim()
    const apellidos = (payload.apellidos || "").trim()
    const tipo = payload.tipo
    if (!nombre) return { success: false, error: "El nombre es obligatorio." }
    if (!apellidos) return { success: false, error: "Los apellidos son obligatorios." }
    if (!tipo) return { success: false, error: "El tipo es obligatorio." }

    const email = (payload.email || "").trim().toLowerCase() || null
    const telefono = (payload.telefono || "").trim() || null

    if (email) {
      const { data: dup } = await supabase
        .from("clientes")
        .select("id")
        .ilike("email", email)
        .limit(1)
        .maybeSingle()
      if (dup) return { success: false, error: `Ya existe un cliente con el email "${email}".` }
    }
    if (telefono) {
      const { data: dup } = await supabase
        .from("clientes")
        .select("id")
        .eq("telefono", telefono.slice(0, 20))
        .limit(1)
        .maybeSingle()
      if (dup) return { success: false, error: `Ya existe un cliente con el teléfono "${telefono}".` }
    }

    const preferencias: string[] = []
    if (payload.preferenciaEmail) preferencias.push("email")
    if (payload.preferenciaTelefono) preferencias.push("telefono")

    const ahora = new Date().toISOString()
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        tipo,
        empresaid: payload.empresaid,
        nombre,
        apellidos,
        email,
        telefono: telefono ? telefono.slice(0, 20) : null,
        puesto: (payload.puesto || "").trim() || null,
        cumpleanos: payload.cumpleanos,
        paisid: payload.paisid,
        estadoid: payload.estadoid,
        ciudadid: payload.ciudadid,
        codigopostal: (payload.codigopostal || "").trim() || null,
        direccion: (payload.direccion || "").trim() || null,
        preferenciasdecontacto: preferencias,
        notas: (payload.notas || "").trim() || null,
        fuente: "SPARK",
        fechacreacion: ahora,
        fechamodificacion: ahora,
      })
      .select("id")
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath("/clientes")
    return { success: true, id: data.id as number }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error creando cliente: " + msg }
  }
}

/**
 * Listado paginado de clientes con búsqueda en id, nombre, apellidos, email, telefono.
 */
export async function listarClientesPaginado(
  search: string = "",
  page: number = 1,
  pageSize: number = 50,
) {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from("clientes")
      .select("id, nombre, apellidos, email, telefono", { count: "exact" })
      .order("id", { ascending: false })

    const s = search.trim()
    if (s) {
      const idNum = Number(s)
      const idOr = Number.isFinite(idNum) && idNum > 0 ? `id.eq.${idNum},` : ""
      q = q.or(
        `${idOr}nombre.ilike.%${s}%,apellidos.ilike.%${s}%,email.ilike.%${s}%,telefono.ilike.%${s}%`,
      )
    }

    const { data, error, count } = await q.range(from, to)
    if (error) return { success: false, error: error.message }
    return { success: true, data: data ?? [], total: count ?? 0, page, pageSize }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error listando clientes: " + msg }
  }
}

export type ClienteContactoSugerencia = {
  id: number
  nombre: string | null
  apellidos: string | null
  email: string | null
  telefono: string | null
}

export async function buscarClientesParaContacto(
  termino: string,
): Promise<ClienteContactoSugerencia[]> {
  const q = (termino || "").trim()
  if (q.length < 2) return []
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, apellidos, email, telefono")
    .or(
      `nombre.ilike.%${q}%,apellidos.ilike.%${q}%,email.ilike.%${q}%,telefono.ilike.%${q}%`,
    )
    .order("nombre", { ascending: true })
    .limit(20)
  if (error) {
    console.error("Error buscando clientes para contacto:", error.message)
    return []
  }
  return (data as ClienteContactoSugerencia[]) || []
}
