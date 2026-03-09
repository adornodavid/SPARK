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
    let query = supabase.from("vw_oclientes").select("*")

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
    let query = supabase.from("vw_oclientes").select("id, nombre, apellidopaterno, apellidomaterno")

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

    const data: ddlItem[] = clientes.map((cliente) => ({
      value: cliente.id.toString(),
      text: `${cliente.nombre} ${cliente.apellidopaterno || ""} ${cliente.apellidomaterno || ""}`.trim(),
    }))

    return { success: true, data }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return { success: false, error: "Error obteniendo lista desplegable de clientes: " + errorMessage }
  }
}
