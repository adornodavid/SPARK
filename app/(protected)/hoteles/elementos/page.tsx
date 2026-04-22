"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { obtenerSesion } from "@/app/actions/session"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Eye, Edit, Ban, Power, Plus, Trash2, Search, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { listaDesplegableHoteles } from "@/app/actions/hoteles"
import {
  listarMobiliarioPorHotel,
  toggleActivoElemento,
  crearMobiliario,
  validarNombreMobiliario,
  listarServicioPorHotel,
  crearServicio,
  validarNombreServicio,
  listarCortesiaPorHotel,
  crearCortesia,
  validarNombreCortesia,
  listarBeneficioPorHotel,
  crearBeneficio,
  validarNombreBeneficio,
  eliminarElemento,
  actualizarMobiliario,
  actualizarServicio,
  actualizarCortesia,
  actualizarBeneficio,
  listarMenuBebidaPorHotel,
  validarNombreMenuBebida,
  crearMenuBebida,
  actualizarMenuBebida,
  eliminarPdfMenuBebida,
  type MobiliarioRow,
  type ServicioRow,
  type CortesiaRow,
  type BeneficioRow,
  type MenuBebidaRow,
} from "@/app/actions/elementos"
import type { ddlItem } from "@/types/common"

export default function ElementosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const [hotelesList, setHotelesList] = useState<ddlItem[]>([])
  const [hotel, setHotel] = useState<string>("-1")
  const [tab, setTab] = useState<string>("mobiliario")

  const [mobiliario, setMobiliario] = useState<MobiliarioRow[]>([])
  const [fetchingMobiliario, setFetchingMobiliario] = useState(false)
  const [servicios, setServicios] = useState<ServicioRow[]>([])
  const [fetchingServicios, setFetchingServicios] = useState(false)
  const [cortesias, setCortesias] = useState<CortesiaRow[]>([])
  const [fetchingCortesias, setFetchingCortesias] = useState(false)
  const [beneficios, setBeneficios] = useState<BeneficioRow[]>([])
  const [fetchingBeneficios, setFetchingBeneficios] = useState(false)
  const [bebidas, setBebidas] = useState<MenuBebidaRow[]>([])
  const [fetchingBebidas, setFetchingBebidas] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [search, setSearch] = useState<string>("")

  const TIPOS = [
    { value: "platillos", label: "Platillos/Alimentos" },
    { value: "bebidas", label: "Bebidas" },
    { value: "mobiliario", label: "Mobiliario" },
    { value: "servicios", label: "Servicios" },
    { value: "cortesias", label: "Cortesías" },
    { value: "beneficios", label: "Beneficios" },
  ]

  const [agregarOpen, setAgregarOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formHotel, setFormHotel] = useState<string>("")
  const [formTipo, setFormTipo] = useState<string>("mobiliario")
  const [formNombre, setFormNombre] = useState("")
  const [formDescripcion, setFormDescripcion] = useState("")
  const [formCosto, setFormCosto] = useState("")
  const [formActivo, setFormActivo] = useState<string>("true")
  const [guardando, setGuardando] = useState(false)
  const [formFeedback, setFormFeedback] = useState<{ tipo: "ok" | "error"; msg: string } | null>(null)
  const [validandoNombre, setValidandoNombre] = useState(false)
  const [nombreValidacion, setNombreValidacion] = useState<{ disponible: boolean; mensaje: string } | null>(null)

  // Estado independiente del formulario de Servicios
  const [srvFormNombre, setSrvFormNombre] = useState("")
  const [srvFormDescripcion, setSrvFormDescripcion] = useState("")
  const [srvFormCosto, setSrvFormCosto] = useState("")
  const [srvFormActivo, setSrvFormActivo] = useState<string>("true")
  const [srvValidandoNombre, setSrvValidandoNombre] = useState(false)
  const [srvNombreValidacion, setSrvNombreValidacion] = useState<{ disponible: boolean; mensaje: string } | null>(null)

  // Estado independiente del formulario de Cortesías
  const [corFormNombre, setCorFormNombre] = useState("")
  const [corFormDescripcion, setCorFormDescripcion] = useState("")
  const [corFormCosto, setCorFormCosto] = useState("")
  const [corFormActivo, setCorFormActivo] = useState<string>("true")
  const [corValidandoNombre, setCorValidandoNombre] = useState(false)
  const [corNombreValidacion, setCorNombreValidacion] = useState<{ disponible: boolean; mensaje: string } | null>(null)

  // Estado independiente del formulario de Beneficios
  const [benFormNombre, setBenFormNombre] = useState("")
  const [benFormDescripcion, setBenFormDescripcion] = useState("")
  const [benFormCosto, setBenFormCosto] = useState("")
  const [benFormActivo, setBenFormActivo] = useState<string>("true")
  const [benValidandoNombre, setBenValidandoNombre] = useState(false)
  const [benNombreValidacion, setBenNombreValidacion] = useState<{ disponible: boolean; mensaje: string } | null>(null)

  // Estado independiente del formulario de Bebidas
  const [bebFormNombre, setBebFormNombre] = useState("")
  const [bebFormDescripcion, setBebFormDescripcion] = useState("")
  const [bebFormCosto, setBebFormCosto] = useState("")
  const [bebFormActivo, setBebFormActivo] = useState<string>("true")
  const [bebFormTipoMenu, setBebFormTipoMenu] = useState<string>("Individual")
  const [bebFormPdfFile, setBebFormPdfFile] = useState<File | null>(null)
  const [bebFormPdfUrlExistente, setBebFormPdfUrlExistente] = useState<string | null>(null)
  const [bebValidandoNombre, setBebValidandoNombre] = useState(false)
  const [bebNombreValidacion, setBebNombreValidacion] = useState<{ disponible: boolean; mensaje: string } | null>(null)
  const [bebEliminandoPdf, setBebEliminandoPdf] = useState(false)

  useEffect(() => {
    async function boot() {
      const session = await obtenerSesion()
      if (!session || !session.SesionActiva) {
        router.push("/auth/login")
        return
      }
      const allowedRoles = [1, 2, 3, 4]
      if (!allowedRoles.includes(Number(session.RolId))) {
        router.push("/dashboard")
        return
      }
      const res = await listaDesplegableHoteles()
      if (res.success && res.data) setHotelesList(res.data)
      setLoading(false)
    }
    boot()
  }, [router])

  useEffect(() => {
    if (loading) return
    const hid = hotel === "-1" ? null : Number(hotel)
    const t = setTimeout(() => {
      if (tab === "mobiliario") {
        setFetchingMobiliario(true)
        listarMobiliarioPorHotel(hid, search).then((r) => {
          if (r.success) setMobiliario(r.data)
          else setMobiliario([])
          setFetchingMobiliario(false)
        })
      } else if (tab === "servicios") {
        setFetchingServicios(true)
        listarServicioPorHotel(hid, search).then((r) => {
          if (r.success) setServicios(r.data)
          else setServicios([])
          setFetchingServicios(false)
        })
      } else if (tab === "cortesias") {
        setFetchingCortesias(true)
        listarCortesiaPorHotel(hid, search).then((r) => {
          if (r.success) setCortesias(r.data)
          else setCortesias([])
          setFetchingCortesias(false)
        })
      } else if (tab === "beneficios") {
        setFetchingBeneficios(true)
        listarBeneficioPorHotel(hid, search).then((r) => {
          if (r.success) setBeneficios(r.data)
          else setBeneficios([])
          setFetchingBeneficios(false)
        })
      } else if (tab === "bebidas") {
        setFetchingBebidas(true)
        listarMenuBebidaPorHotel(hid, search).then((r) => {
          if (r.success) setBebidas(r.data)
          else setBebidas([])
          setFetchingBebidas(false)
        })
      }
    }, 300)
    return () => clearTimeout(t)
  }, [loading, tab, hotel, search])

  function resetTodosLosForms() {
    // Reset Mobiliario
    setFormNombre("")
    setFormDescripcion("")
    setFormCosto("")
    setFormActivo("true")
    setNombreValidacion(null)
    // Reset Servicios
    setSrvFormNombre("")
    setSrvFormDescripcion("")
    setSrvFormCosto("")
    setSrvFormActivo("true")
    setSrvNombreValidacion(null)
    // Reset Cortesías
    setCorFormNombre("")
    setCorFormDescripcion("")
    setCorFormCosto("")
    setCorFormActivo("true")
    setCorNombreValidacion(null)
    // Reset Beneficios
    setBenFormNombre("")
    setBenFormDescripcion("")
    setBenFormCosto("")
    setBenFormActivo("true")
    setBenNombreValidacion(null)
    // Reset Bebidas
    setBebFormNombre("")
    setBebFormDescripcion("")
    setBebFormCosto("")
    setBebFormActivo("true")
    setBebFormTipoMenu("Individual")
    setBebFormPdfFile(null)
    setBebFormPdfUrlExistente(null)
    setBebNombreValidacion(null)
  }

  function abrirModalAgregar() {
    const hotelInicial =
      hotel !== "-1" ? hotel : hotelesList.length > 0 ? hotelesList[0].value : ""
    setModalMode("create")
    setEditingId(null)
    setFormHotel(hotelInicial)
    setFormTipo(tab)
    resetTodosLosForms()
    setFormFeedback(null)
    setAgregarOpen(true)
  }

  async function abrirModalEditar(
    tipo: string,
    row: {
      id: number
      nombre: string | null
      descripcion: string | null
      costo: number | null
      activo: boolean | null
      hotelid: number | null
      tipomenu?: string | null
      documentopdf?: string | null
    },
  ) {
    setModalMode("edit")
    setEditingId(row.id)
    setFormHotel(row.hotelid != null ? String(row.hotelid) : "")
    setFormTipo(tipo)
    resetTodosLosForms()
    setFormFeedback(null)

    const nombre = row.nombre ?? ""
    const descripcion = row.descripcion ?? ""
    const costo = row.costo != null ? String(row.costo) : ""
    const activo = row.activo ? "true" : "false"

    if (tipo === "mobiliario") {
      setFormNombre(nombre)
      setFormDescripcion(descripcion)
      setFormCosto(costo)
      setFormActivo(activo)
    } else if (tipo === "servicios") {
      setSrvFormNombre(nombre)
      setSrvFormDescripcion(descripcion)
      setSrvFormCosto(costo)
      setSrvFormActivo(activo)
    } else if (tipo === "cortesias") {
      setCorFormNombre(nombre)
      setCorFormDescripcion(descripcion)
      setCorFormCosto(costo)
      setCorFormActivo(activo)
    } else if (tipo === "beneficios") {
      setBenFormNombre(nombre)
      setBenFormDescripcion(descripcion)
      setBenFormCosto(costo)
      setBenFormActivo(activo)
    } else if (tipo === "bebidas") {
      setBebFormNombre(nombre)
      setBebFormDescripcion(descripcion)
      setBebFormCosto(costo)
      setBebFormActivo(activo)
      setBebFormTipoMenu(row.tipomenu ?? "Individual")
      setBebFormPdfFile(null)
      setBebFormPdfUrlExistente(row.documentopdf ?? null)
    }
    setAgregarOpen(true)

    // Pre-validar el nombre (excluyendo el id propio) para que Guardar quede habilitado.
    if (row.hotelid && nombre.trim()) {
      if (tipo === "mobiliario") {
        setValidandoNombre(true)
        const r = await validarNombreMobiliario(nombre, row.hotelid, row.id)
        setNombreValidacion(r)
        setValidandoNombre(false)
      } else if (tipo === "servicios") {
        setSrvValidandoNombre(true)
        const r = await validarNombreServicio(nombre, row.hotelid, row.id)
        setSrvNombreValidacion(r)
        setSrvValidandoNombre(false)
      } else if (tipo === "cortesias") {
        setCorValidandoNombre(true)
        const r = await validarNombreCortesia(nombre, row.hotelid, row.id)
        setCorNombreValidacion(r)
        setCorValidandoNombre(false)
      } else if (tipo === "beneficios") {
        setBenValidandoNombre(true)
        const r = await validarNombreBeneficio(nombre, row.hotelid, row.id)
        setBenNombreValidacion(r)
        setBenValidandoNombre(false)
      } else if (tipo === "bebidas") {
        setBebValidandoNombre(true)
        const r = await validarNombreMenuBebida(nombre, row.hotelid, row.id)
        setBebNombreValidacion(r)
        setBebValidandoNombre(false)
      }
    }
  }

  function limpiarFormularioMobiliario() {
    setFormNombre("")
    setFormDescripcion("")
    setFormCosto("")
    setFormActivo("true")
    setNombreValidacion(null)
  }

  function limpiarFormularioServicios() {
    setSrvFormNombre("")
    setSrvFormDescripcion("")
    setSrvFormCosto("")
    setSrvFormActivo("true")
    setSrvNombreValidacion(null)
  }

  function limpiarFormularioCortesias() {
    setCorFormNombre("")
    setCorFormDescripcion("")
    setCorFormCosto("")
    setCorFormActivo("true")
    setCorNombreValidacion(null)
  }

  function limpiarFormularioBeneficios() {
    setBenFormNombre("")
    setBenFormDescripcion("")
    setBenFormCosto("")
    setBenFormActivo("true")
    setBenNombreValidacion(null)
  }

  function limpiarFormularioBebidas() {
    setBebFormNombre("")
    setBebFormDescripcion("")
    setBebFormCosto("")
    setBebFormActivo("true")
    setBebFormTipoMenu("Individual")
    setBebFormPdfFile(null)
    setBebFormPdfUrlExistente(null)
    setBebNombreValidacion(null)
  }

  async function onValidarNombreMobiliario() {
    setFormFeedback(null)
    if (!formNombre.trim()) {
      setNombreValidacion({ disponible: false, mensaje: "El nombre está vacío." })
      return
    }
    if (!formHotel) {
      setNombreValidacion({ disponible: false, mensaje: "Selecciona un hotel primero." })
      return
    }
    setValidandoNombre(true)
    const excluir = modalMode === "edit" ? editingId : null
    const r = await validarNombreMobiliario(formNombre, Number(formHotel), excluir)
    setNombreValidacion(r)
    setValidandoNombre(false)
  }

  async function onValidarNombreServicios() {
    setFormFeedback(null)
    if (!srvFormNombre.trim()) {
      setSrvNombreValidacion({ disponible: false, mensaje: "El nombre está vacío." })
      return
    }
    if (!formHotel) {
      setSrvNombreValidacion({ disponible: false, mensaje: "Selecciona un hotel primero." })
      return
    }
    setSrvValidandoNombre(true)
    const excluir = modalMode === "edit" ? editingId : null
    const r = await validarNombreServicio(srvFormNombre, Number(formHotel), excluir)
    setSrvNombreValidacion(r)
    setSrvValidandoNombre(false)
  }

  async function onValidarNombreCortesias() {
    setFormFeedback(null)
    if (!corFormNombre.trim()) {
      setCorNombreValidacion({ disponible: false, mensaje: "El nombre está vacío." })
      return
    }
    if (!formHotel) {
      setCorNombreValidacion({ disponible: false, mensaje: "Selecciona un hotel primero." })
      return
    }
    setCorValidandoNombre(true)
    const excluir = modalMode === "edit" ? editingId : null
    const r = await validarNombreCortesia(corFormNombre, Number(formHotel), excluir)
    setCorNombreValidacion(r)
    setCorValidandoNombre(false)
  }

  async function onValidarNombreBeneficios() {
    setFormFeedback(null)
    if (!benFormNombre.trim()) {
      setBenNombreValidacion({ disponible: false, mensaje: "El nombre está vacío." })
      return
    }
    if (!formHotel) {
      setBenNombreValidacion({ disponible: false, mensaje: "Selecciona un hotel primero." })
      return
    }
    setBenValidandoNombre(true)
    const excluir = modalMode === "edit" ? editingId : null
    const r = await validarNombreBeneficio(benFormNombre, Number(formHotel), excluir)
    setBenNombreValidacion(r)
    setBenValidandoNombre(false)
  }

  async function onValidarNombreBebidas() {
    setFormFeedback(null)
    if (!bebFormNombre.trim()) {
      setBebNombreValidacion({ disponible: false, mensaje: "El nombre está vacío." })
      return
    }
    if (!formHotel) {
      setBebNombreValidacion({ disponible: false, mensaje: "Selecciona un hotel primero." })
      return
    }
    setBebValidandoNombre(true)
    const excluir = modalMode === "edit" ? editingId : null
    const r = await validarNombreMenuBebida(bebFormNombre, Number(formHotel), excluir)
    setBebNombreValidacion(r)
    setBebValidandoNombre(false)
  }

  async function onEliminarPdfBebida() {
    if (!editingId) return
    if (!confirm("¿Deseas eliminar el PDF asociado a este registro?")) return
    setBebEliminandoPdf(true)
    const r = await eliminarPdfMenuBebida(editingId)
    setBebEliminandoPdf(false)
    if (!r.success) {
      alert(r.error || "Error al eliminar PDF")
      return
    }
    setBebFormPdfUrlExistente(null)
    setBebidas((prev) => prev.map((x) => (x.id === editingId ? { ...x, documentopdf: null } : x)))
  }

  async function onGuardarAgregar() {
    setFormFeedback(null)
    if (!formHotel) {
      setFormFeedback({ tipo: "error", msg: "Debes seleccionar un hotel." })
      return
    }

    setGuardando(true)
    try {
      if (formTipo === "mobiliario") {
        if (!formNombre.trim()) {
          setFormFeedback({ tipo: "error", msg: "El nombre es obligatorio." })
          return
        }
        if (!nombreValidacion?.disponible) {
          setFormFeedback({ tipo: "error", msg: "Debes validar el nombre antes de guardar." })
          return
        }
        const costoNum = formCosto.trim() === "" ? null : Number(formCosto)
        if (costoNum !== null && !Number.isFinite(costoNum)) {
          setFormFeedback({ tipo: "error", msg: "Costo inválido." })
          return
        }
        const payload = {
          hotelid: Number(formHotel),
          nombre: formNombre,
          descripcion: formDescripcion,
          costo: costoNum,
          activo: formActivo === "true",
        }
        if (modalMode === "edit" && editingId != null) {
          const r = await actualizarMobiliario(editingId, payload)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al actualizar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro actualizado correctamente.` })
          if (tab === "mobiliario") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarMobiliarioPorHotel(hid, search)
            if (listado.success) setMobiliario(listado.data)
          }
          setAgregarOpen(false)
        } else {
          const r = await crearMobiliario(payload)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al guardar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro guardado correctamente (id ${r.id}).` })
          limpiarFormularioMobiliario()
          if (tab === "mobiliario") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarMobiliarioPorHotel(hid, search)
            if (listado.success) setMobiliario(listado.data)
          }
        }
      } else if (formTipo === "servicios") {
        if (!srvFormNombre.trim()) {
          setFormFeedback({ tipo: "error", msg: "El nombre es obligatorio." })
          return
        }
        if (!srvNombreValidacion?.disponible) {
          setFormFeedback({ tipo: "error", msg: "Debes validar el nombre antes de guardar." })
          return
        }
        const costoNum = srvFormCosto.trim() === "" ? null : Number(srvFormCosto)
        if (costoNum !== null && !Number.isFinite(costoNum)) {
          setFormFeedback({ tipo: "error", msg: "Costo inválido." })
          return
        }
        const payload = {
          hotelid: Number(formHotel),
          nombre: srvFormNombre,
          descripcion: srvFormDescripcion,
          costo: costoNum,
          activo: srvFormActivo === "true",
        }
        if (modalMode === "edit" && editingId != null) {
          const r = await actualizarServicio(editingId, payload)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al actualizar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro actualizado correctamente.` })
          if (tab === "servicios") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarServicioPorHotel(hid, search)
            if (listado.success) setServicios(listado.data)
          }
          setAgregarOpen(false)
        } else {
          const r = await crearServicio(payload)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al guardar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro guardado correctamente (id ${r.id}).` })
          limpiarFormularioServicios()
          if (tab === "servicios") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarServicioPorHotel(hid, search)
            if (listado.success) setServicios(listado.data)
          }
        }
      } else if (formTipo === "cortesias") {
        if (!corFormNombre.trim()) {
          setFormFeedback({ tipo: "error", msg: "El nombre es obligatorio." })
          return
        }
        if (!corNombreValidacion?.disponible) {
          setFormFeedback({ tipo: "error", msg: "Debes validar el nombre antes de guardar." })
          return
        }
        const costoNum = corFormCosto.trim() === "" ? null : Number(corFormCosto)
        if (costoNum !== null && !Number.isFinite(costoNum)) {
          setFormFeedback({ tipo: "error", msg: "Costo inválido." })
          return
        }
        const payload = {
          hotelid: Number(formHotel),
          nombre: corFormNombre,
          descripcion: corFormDescripcion,
          costo: costoNum,
          activo: corFormActivo === "true",
        }
        if (modalMode === "edit" && editingId != null) {
          const r = await actualizarCortesia(editingId, payload)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al actualizar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro actualizado correctamente.` })
          if (tab === "cortesias") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarCortesiaPorHotel(hid, search)
            if (listado.success) setCortesias(listado.data)
          }
          setAgregarOpen(false)
        } else {
          const r = await crearCortesia(payload)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al guardar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro guardado correctamente (id ${r.id}).` })
          limpiarFormularioCortesias()
          if (tab === "cortesias") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarCortesiaPorHotel(hid, search)
            if (listado.success) setCortesias(listado.data)
          }
        }
      } else if (formTipo === "beneficios") {
        if (!benFormNombre.trim()) {
          setFormFeedback({ tipo: "error", msg: "El nombre es obligatorio." })
          return
        }
        if (!benNombreValidacion?.disponible) {
          setFormFeedback({ tipo: "error", msg: "Debes validar el nombre antes de guardar." })
          return
        }
        const costoNum = benFormCosto.trim() === "" ? null : Number(benFormCosto)
        if (costoNum !== null && !Number.isFinite(costoNum)) {
          setFormFeedback({ tipo: "error", msg: "Costo inválido." })
          return
        }
        const payload = {
          hotelid: Number(formHotel),
          nombre: benFormNombre,
          descripcion: benFormDescripcion,
          costo: costoNum,
          activo: benFormActivo === "true",
        }
        if (modalMode === "edit" && editingId != null) {
          const r = await actualizarBeneficio(editingId, payload)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al actualizar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro actualizado correctamente.` })
          if (tab === "beneficios") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarBeneficioPorHotel(hid, search)
            if (listado.success) setBeneficios(listado.data)
          }
          setAgregarOpen(false)
        } else {
          const r = await crearBeneficio(payload)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al guardar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro guardado correctamente (id ${r.id}).` })
          limpiarFormularioBeneficios()
          if (tab === "beneficios") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarBeneficioPorHotel(hid, search)
            if (listado.success) setBeneficios(listado.data)
          }
        }
      } else if (formTipo === "bebidas") {
        if (!bebFormNombre.trim()) {
          setFormFeedback({ tipo: "error", msg: "El nombre es obligatorio." })
          return
        }
        if (!bebNombreValidacion?.disponible) {
          setFormFeedback({ tipo: "error", msg: "Debes validar el nombre antes de guardar." })
          return
        }
        const costoNum = bebFormCosto.trim() === "" ? null : Number(bebFormCosto)
        if (costoNum !== null && !Number.isFinite(costoNum)) {
          setFormFeedback({ tipo: "error", msg: "Costo inválido." })
          return
        }
        const fd = new FormData()
        fd.set("hotelid", formHotel)
        fd.set("nombre", bebFormNombre)
        fd.set("descripcion", bebFormDescripcion)
        fd.set("costo", costoNum != null ? String(costoNum) : "")
        fd.set("activo", bebFormActivo)
        fd.set("tipomenu", bebFormTipoMenu)
        if (bebFormPdfFile) fd.set("pdfFile", bebFormPdfFile)

        if (modalMode === "edit" && editingId != null) {
          fd.set("id", String(editingId))
          const r = await actualizarMenuBebida(fd)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al actualizar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro actualizado correctamente.` })
          if (tab === "bebidas") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarMenuBebidaPorHotel(hid, search)
            if (listado.success) setBebidas(listado.data)
          }
          setAgregarOpen(false)
        } else {
          const r = await crearMenuBebida(fd)
          if (!r.success) {
            setFormFeedback({ tipo: "error", msg: r.error || "Error al guardar." })
            return
          }
          setFormFeedback({ tipo: "ok", msg: `Registro guardado correctamente (id ${r.id}).` })
          limpiarFormularioBebidas()
          if (tab === "bebidas") {
            const hid = hotel === "-1" ? null : Number(hotel)
            const listado = await listarMenuBebidaPorHotel(hid, search)
            if (listado.success) setBebidas(listado.data)
          }
        }
      } else {
        setFormFeedback({ tipo: "error", msg: `Tipo "${formTipo}" aún no implementado.` })
      }
    } finally {
      setGuardando(false)
    }
  }

  async function onEliminar(tipo: string, id: number, hotelidRow: number | null) {
    if (!confirm("¿Deseas eliminar este registro? Esta acción no se puede deshacer.")) return
    setEliminandoId(id)
    const r = await eliminarElemento(tipo, id, hotelidRow)
    setEliminandoId(null)
    if (!r.success) {
      alert(r.error || "Error al eliminar")
      return
    }
    if (tipo === "mobiliario") {
      setMobiliario((prev) => prev.filter((x) => x.id !== id))
    } else if (tipo === "servicios") {
      setServicios((prev) => prev.filter((x) => x.id !== id))
    } else if (tipo === "cortesias") {
      setCortesias((prev) => prev.filter((x) => x.id !== id))
    } else if (tipo === "beneficios") {
      setBeneficios((prev) => prev.filter((x) => x.id !== id))
    } else if (tipo === "bebidas") {
      setBebidas((prev) => prev.filter((x) => x.id !== id))
    }
  }

  async function onToggleActivo(tipo: string, id: number, activoActual: boolean | null) {
    const accion = activoActual ? "inactivar" : "activar"
    if (!confirm(`¿Deseas ${accion} este registro?`)) return
    setTogglingId(id)
    const r = await toggleActivoElemento(tipo, id)
    setTogglingId(null)
    if (!r.success) {
      alert(r.error || "Error al cambiar el estado")
      return
    }
    if (tipo === "mobiliario") {
      setMobiliario((prev) => prev.map((x) => (x.id === id ? { ...x, activo: r.activo ?? !activoActual } : x)))
    } else if (tipo === "servicios") {
      setServicios((prev) => prev.map((x) => (x.id === id ? { ...x, activo: r.activo ?? !activoActual } : x)))
    } else if (tipo === "cortesias") {
      setCortesias((prev) => prev.map((x) => (x.id === id ? { ...x, activo: r.activo ?? !activoActual } : x)))
    } else if (tipo === "beneficios") {
      setBeneficios((prev) => prev.map((x) => (x.id === id ? { ...x, activo: r.activo ?? !activoActual } : x)))
    } else if (tipo === "bebidas") {
      setBebidas((prev) => prev.map((x) => (x.id === id ? { ...x, activo: r.activo ?? !activoActual } : x)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Elementos</h1>
          <p className="text-sm text-muted-foreground mt-1">Catálogos de elementos por hotel</p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-[16rem] gap-3">
              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel</Label>
                <Select value={hotel} onValueChange={setHotel}>
                  <SelectTrigger id="hotel" className="w-64">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos</SelectItem>
                    {hotelesList.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <TabsList className="h-auto flex-wrap">
                  <TabsTrigger value="platillos">Platillos/Alimentos</TabsTrigger>
                  <TabsTrigger value="bebidas">Bebidas</TabsTrigger>
                  <TabsTrigger value="mobiliario">Mobiliario</TabsTrigger>
                  <TabsTrigger value="servicios">Servicios</TabsTrigger>
                  <TabsTrigger value="cortesias">Cortesías</TabsTrigger>
                  <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
                </TabsList>
                <Button onClick={abrirModalAgregar} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {search && (
                  <Button variant="outline" onClick={() => setSearch("")} className="gap-2">
                    <X className="h-4 w-4" />
                    Limpiar
                  </Button>
                )}
              </div>

              <TabsContent value="platillos" className="mt-4">
                <p className="text-sm text-muted-foreground">Pendiente.</p>
              </TabsContent>

              <TabsContent value="bebidas" className="mt-4">
                <div className="rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hotel</TableHead>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-28 text-right">Costo</TableHead>
                        <TableHead className="w-24">Activo</TableHead>
                        <TableHead className="w-40 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fetchingBebidas ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                            Cargando…
                          </TableCell>
                        </TableRow>
                      ) : bebidas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Sin resultados
                          </TableCell>
                        </TableRow>
                      ) : (
                        bebidas.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>{b.hotelnombre || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{b.id}</TableCell>
                            <TableCell>{b.nombre || "—"}</TableCell>
                            <TableCell className="text-right">
                              {b.costo != null
                                ? b.costo.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                                : "—"}
                            </TableCell>
                            <TableCell>{b.activo ? "Sí" : "No"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button asChild variant="ghost" size="sm" title="Ver">
                                  <Link href={`/hoteles/elementos/${b.id}/view?tipo=bebidas`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" title="Editar" onClick={() => abrirModalEditar("bebidas", b)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={b.activo ? "Inactivar" : "Activar"}
                                  disabled={togglingId === b.id}
                                  onClick={() => onToggleActivo("bebidas", b.id, b.activo)}
                                >
                                  {togglingId === b.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : b.activo ? (
                                    <Ban className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <Power className="h-4 w-4 text-emerald-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Eliminar"
                                  disabled={eliminandoId === b.id}
                                  onClick={() => onEliminar("bebidas", b.id, b.hotelid)}
                                >
                                  {eliminandoId === b.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="mobiliario" className="mt-4">
                <div className="rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hotel</TableHead>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-28 text-right">Costo</TableHead>
                        <TableHead className="w-24">Activo</TableHead>
                        <TableHead className="w-40 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fetchingMobiliario ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                            Cargando…
                          </TableCell>
                        </TableRow>
                      ) : mobiliario.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Sin resultados
                          </TableCell>
                        </TableRow>
                      ) : (
                        mobiliario.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>{m.hotelnombre || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{m.id}</TableCell>
                            <TableCell>{m.nombre || "—"}</TableCell>
                            <TableCell className="text-right">
                              {m.costo != null
                                ? m.costo.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                                : "—"}
                            </TableCell>
                            <TableCell>{m.activo ? "Sí" : "No"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button asChild variant="ghost" size="sm" title="Ver">
                                  <Link href={`/hoteles/elementos/${m.id}/view?tipo=mobiliario`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" title="Editar" onClick={() => abrirModalEditar("mobiliario", m)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={m.activo ? "Inactivar" : "Activar"}
                                  disabled={togglingId === m.id}
                                  onClick={() => onToggleActivo("mobiliario", m.id, m.activo)}
                                >
                                  {togglingId === m.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : m.activo ? (
                                    <Ban className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <Power className="h-4 w-4 text-emerald-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Eliminar"
                                  disabled={eliminandoId === m.id}
                                  onClick={() => onEliminar("mobiliario", m.id, m.hotelid)}
                                >
                                  {eliminandoId === m.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="servicios" className="mt-4">
                <div className="rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hotel</TableHead>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-28 text-right">Costo</TableHead>
                        <TableHead className="w-24">Activo</TableHead>
                        <TableHead className="w-40 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fetchingServicios ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                            Cargando…
                          </TableCell>
                        </TableRow>
                      ) : servicios.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Sin resultados
                          </TableCell>
                        </TableRow>
                      ) : (
                        servicios.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>{s.hotelnombre || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{s.id}</TableCell>
                            <TableCell>{s.nombre || "—"}</TableCell>
                            <TableCell className="text-right">
                              {s.costo != null
                                ? s.costo.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                                : "—"}
                            </TableCell>
                            <TableCell>{s.activo ? "Sí" : "No"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button asChild variant="ghost" size="sm" title="Ver">
                                  <Link href={`/hoteles/elementos/${s.id}/view?tipo=servicios`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" title="Editar" onClick={() => abrirModalEditar("servicios", s)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={s.activo ? "Inactivar" : "Activar"}
                                  disabled={togglingId === s.id}
                                  onClick={() => onToggleActivo("servicios", s.id, s.activo)}
                                >
                                  {togglingId === s.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : s.activo ? (
                                    <Ban className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <Power className="h-4 w-4 text-emerald-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Eliminar"
                                  disabled={eliminandoId === s.id}
                                  onClick={() => onEliminar("servicios", s.id, s.hotelid)}
                                >
                                  {eliminandoId === s.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="cortesias" className="mt-4">
                <div className="rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hotel</TableHead>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-28 text-right">Costo</TableHead>
                        <TableHead className="w-24">Activo</TableHead>
                        <TableHead className="w-40 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fetchingCortesias ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                            Cargando…
                          </TableCell>
                        </TableRow>
                      ) : cortesias.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Sin resultados
                          </TableCell>
                        </TableRow>
                      ) : (
                        cortesias.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.hotelnombre || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{c.id}</TableCell>
                            <TableCell>{c.nombre || "—"}</TableCell>
                            <TableCell className="text-right">
                              {c.costo != null
                                ? c.costo.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                                : "—"}
                            </TableCell>
                            <TableCell>{c.activo ? "Sí" : "No"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button asChild variant="ghost" size="sm" title="Ver">
                                  <Link href={`/hoteles/elementos/${c.id}/view?tipo=cortesias`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" title="Editar" onClick={() => abrirModalEditar("cortesias", c)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={c.activo ? "Inactivar" : "Activar"}
                                  disabled={togglingId === c.id}
                                  onClick={() => onToggleActivo("cortesias", c.id, c.activo)}
                                >
                                  {togglingId === c.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : c.activo ? (
                                    <Ban className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <Power className="h-4 w-4 text-emerald-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Eliminar"
                                  disabled={eliminandoId === c.id}
                                  onClick={() => onEliminar("cortesias", c.id, c.hotelid)}
                                >
                                  {eliminandoId === c.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="beneficios" className="mt-4">
                <div className="rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hotel</TableHead>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-28 text-right">Costo</TableHead>
                        <TableHead className="w-24">Activo</TableHead>
                        <TableHead className="w-40 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fetchingBeneficios ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                            Cargando…
                          </TableCell>
                        </TableRow>
                      ) : beneficios.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Sin resultados
                          </TableCell>
                        </TableRow>
                      ) : (
                        beneficios.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>{b.hotelnombre || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{b.id}</TableCell>
                            <TableCell>{b.nombre || "—"}</TableCell>
                            <TableCell className="text-right">
                              {b.costo != null
                                ? b.costo.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                                : "—"}
                            </TableCell>
                            <TableCell>{b.activo ? "Sí" : "No"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button asChild variant="ghost" size="sm" title="Ver">
                                  <Link href={`/hoteles/elementos/${b.id}/view?tipo=beneficios`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" title="Editar" onClick={() => abrirModalEditar("beneficios", b)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={b.activo ? "Inactivar" : "Activar"}
                                  disabled={togglingId === b.id}
                                  onClick={() => onToggleActivo("beneficios", b.id, b.activo)}
                                >
                                  {togglingId === b.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : b.activo ? (
                                    <Ban className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <Power className="h-4 w-4 text-emerald-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Eliminar"
                                  disabled={eliminandoId === b.id}
                                  onClick={() => onEliminar("beneficios", b.id, b.hotelid)}
                                >
                                  {eliminandoId === b.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={agregarOpen} onOpenChange={setAgregarOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalMode === "edit" ? "Editar elemento" : "Agregar elemento"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="form-hotel">Hotel</Label>
              <Select
                value={formHotel}
                onValueChange={(v) => {
                  setFormHotel(v)
                  setNombreValidacion(null)
                }}
              >
                <SelectTrigger id="form-hotel" className="w-full">
                  <SelectValue placeholder="Selecciona un hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotelesList.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-tipo">Tipo</Label>
              <Select
                value={formTipo}
                onValueChange={(v) => {
                  setFormTipo(v)
                  setNombreValidacion(null)
                }}
                disabled={modalMode === "edit"}
              >
                <SelectTrigger id="form-tipo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formTipo === "mobiliario" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="form-mob-nombre">
                    Nombre <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="form-mob-nombre"
                      value={formNombre}
                      onChange={(e) => {
                        setFormNombre(e.target.value)
                        setNombreValidacion(null)
                      }}
                      placeholder="Nombre del mobiliario"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onValidarNombreMobiliario}
                      disabled={validandoNombre || !formNombre.trim() || !formHotel}
                    >
                      {validandoNombre && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Validar
                    </Button>
                  </div>
                  {nombreValidacion && (
                    <p
                      className={`text-xs ${
                        nombreValidacion.disponible ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {nombreValidacion.mensaje}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-mob-descripcion">Descripción</Label>
                  <Input
                    id="form-mob-descripcion"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-mob-costo">Costo</Label>
                  <Input
                    id="form-mob-costo"
                    value={formCosto}
                    onChange={(e) => setFormCosto(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-mob-activo">Activo</Label>
                  <Select value={formActivo} onValueChange={setFormActivo}>
                    <SelectTrigger id="form-mob-activo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formTipo === "servicios" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="form-srv-nombre">
                    Nombre <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="form-srv-nombre"
                      value={srvFormNombre}
                      onChange={(e) => {
                        setSrvFormNombre(e.target.value)
                        setSrvNombreValidacion(null)
                      }}
                      placeholder="Nombre del servicio"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onValidarNombreServicios}
                      disabled={srvValidandoNombre || !srvFormNombre.trim() || !formHotel}
                    >
                      {srvValidandoNombre && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Validar
                    </Button>
                  </div>
                  {srvNombreValidacion && (
                    <p
                      className={`text-xs ${
                        srvNombreValidacion.disponible ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {srvNombreValidacion.mensaje}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-srv-descripcion">Descripción</Label>
                  <Input
                    id="form-srv-descripcion"
                    value={srvFormDescripcion}
                    onChange={(e) => setSrvFormDescripcion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-srv-costo">Costo</Label>
                  <Input
                    id="form-srv-costo"
                    value={srvFormCosto}
                    onChange={(e) => setSrvFormCosto(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-srv-activo">Activo</Label>
                  <Select value={srvFormActivo} onValueChange={setSrvFormActivo}>
                    <SelectTrigger id="form-srv-activo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formTipo === "cortesias" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="form-cor-nombre">
                    Nombre <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="form-cor-nombre"
                      value={corFormNombre}
                      onChange={(e) => {
                        setCorFormNombre(e.target.value)
                        setCorNombreValidacion(null)
                      }}
                      placeholder="Nombre de la cortesía"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onValidarNombreCortesias}
                      disabled={corValidandoNombre || !corFormNombre.trim() || !formHotel}
                    >
                      {corValidandoNombre && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Validar
                    </Button>
                  </div>
                  {corNombreValidacion && (
                    <p
                      className={`text-xs ${
                        corNombreValidacion.disponible ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {corNombreValidacion.mensaje}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-cor-descripcion">Descripción</Label>
                  <Input
                    id="form-cor-descripcion"
                    value={corFormDescripcion}
                    onChange={(e) => setCorFormDescripcion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-cor-costo">Costo</Label>
                  <Input
                    id="form-cor-costo"
                    value={corFormCosto}
                    onChange={(e) => setCorFormCosto(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-cor-activo">Activo</Label>
                  <Select value={corFormActivo} onValueChange={setCorFormActivo}>
                    <SelectTrigger id="form-cor-activo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formTipo === "bebidas" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="form-beb-nombre">
                    Nombre <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="form-beb-nombre"
                      value={bebFormNombre}
                      onChange={(e) => {
                        setBebFormNombre(e.target.value)
                        setBebNombreValidacion(null)
                      }}
                      placeholder="Nombre del menú de bebidas"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onValidarNombreBebidas}
                      disabled={bebValidandoNombre || !bebFormNombre.trim() || !formHotel}
                    >
                      {bebValidandoNombre && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Validar
                    </Button>
                  </div>
                  {bebNombreValidacion && (
                    <p
                      className={`text-xs ${
                        bebNombreValidacion.disponible ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {bebNombreValidacion.mensaje}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-beb-descripcion">Descripción</Label>
                  <Input
                    id="form-beb-descripcion"
                    value={bebFormDescripcion}
                    onChange={(e) => setBebFormDescripcion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-beb-costo">Costo</Label>
                  <Input
                    id="form-beb-costo"
                    value={bebFormCosto}
                    onChange={(e) => setBebFormCosto(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-beb-tipomenu">Tipo de menú</Label>
                  <Select value={bebFormTipoMenu} onValueChange={setBebFormTipoMenu}>
                    <SelectTrigger id="form-beb-tipomenu" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Completo">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-beb-activo">Activo</Label>
                  <Select value={bebFormActivo} onValueChange={setBebFormActivo}>
                    <SelectTrigger id="form-beb-activo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-beb-pdf">Archivo PDF</Label>
                  <Input
                    id="form-beb-pdf"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setBebFormPdfFile(e.target.files?.[0] ?? null)}
                  />
                  {(bebFormPdfFile || bebFormPdfUrlExistente) && (
                    <div className="rounded-md border bg-muted/30 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {bebFormPdfFile
                            ? `Archivo seleccionado: ${bebFormPdfFile.name}`
                            : "PDF actual"}
                        </p>
                        {modalMode === "edit" && bebFormPdfUrlExistente && !bebFormPdfFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Eliminar PDF"
                            disabled={bebEliminandoPdf}
                            onClick={onEliminarPdfBebida}
                          >
                            {bebEliminandoPdf ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                          </Button>
                        )}
                        {bebFormPdfFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Quitar selección"
                            onClick={() => setBebFormPdfFile(null)}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                      <iframe
                        src={
                          bebFormPdfFile
                            ? URL.createObjectURL(bebFormPdfFile)
                            : bebFormPdfUrlExistente ?? ""
                        }
                        className="w-full h-64 rounded border"
                        title="Vista previa PDF"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {formTipo === "beneficios" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="form-ben-nombre">
                    Nombre <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="form-ben-nombre"
                      value={benFormNombre}
                      onChange={(e) => {
                        setBenFormNombre(e.target.value)
                        setBenNombreValidacion(null)
                      }}
                      placeholder="Nombre del beneficio"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onValidarNombreBeneficios}
                      disabled={benValidandoNombre || !benFormNombre.trim() || !formHotel}
                    >
                      {benValidandoNombre && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Validar
                    </Button>
                  </div>
                  {benNombreValidacion && (
                    <p
                      className={`text-xs ${
                        benNombreValidacion.disponible ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {benNombreValidacion.mensaje}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-ben-descripcion">Descripción</Label>
                  <Input
                    id="form-ben-descripcion"
                    value={benFormDescripcion}
                    onChange={(e) => setBenFormDescripcion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-ben-costo">Costo</Label>
                  <Input
                    id="form-ben-costo"
                    value={benFormCosto}
                    onChange={(e) => setBenFormCosto(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-ben-activo">Activo</Label>
                  <Select value={benFormActivo} onValueChange={setBenFormActivo}>
                    <SelectTrigger id="form-ben-activo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-col items-stretch gap-2 sm:flex-col sm:space-x-0">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAgregarOpen(false)} disabled={guardando}>
                Cerrar
              </Button>
              <Button
                onClick={onGuardarAgregar}
                disabled={
                  guardando ||
                  !formHotel ||
                  (formTipo === "mobiliario" && (!formNombre.trim() || !nombreValidacion?.disponible)) ||
                  (formTipo === "servicios" && (!srvFormNombre.trim() || !srvNombreValidacion?.disponible)) ||
                  (formTipo === "cortesias" && (!corFormNombre.trim() || !corNombreValidacion?.disponible)) ||
                  (formTipo === "beneficios" && (!benFormNombre.trim() || !benNombreValidacion?.disponible)) ||
                  (formTipo === "bebidas" && (!bebFormNombre.trim() || !bebNombreValidacion?.disponible))
                }
              >
                {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
            {formFeedback && (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  formFeedback.tipo === "ok"
                    ? "border-green-500/40 bg-green-500/10 text-green-700"
                    : "border-red-500/40 bg-red-500/10 text-red-700"
                }`}
              >
                {formFeedback.msg}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
