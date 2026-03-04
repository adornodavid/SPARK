"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Mail, ArrowLeft, FileText } from "lucide-react"

export default function QuotationSummaryPage() {
  const router = useRouter()
  const [quotationData, setQuotationData] = useState<any>(null)
  const [hotelName, setHotelName] = useState("")
  const [salonName, setSalonName] = useState("")
  const [montajeName, setMontajeName] = useState("")

  useEffect(() => {
    const data = sessionStorage.getItem("quotationData")
    if (data) {
      const parsed = JSON.parse(data)
      setQuotationData(parsed)
      
      // Aquí podrías hacer llamadas para obtener los nombres completos
      // Por ahora mostraremos los IDs
      setHotelName(`Hotel ID: ${parsed.hotel}`)
      setSalonName(`Salón ID: ${parsed.salon}`)
      setMontajeName(`Montaje ID: ${parsed.montaje}`)
    } else {
      router.push("/cotizaciones/new")
    }
  }, [router])

  const handleDownloadPDF = () => {
    alert("Funcionalidad de descarga de PDF en desarrollo")
  }

  const handleSendEmail = () => {
    alert("Funcionalidad de envío por correo en desarrollo")
  }

  if (!quotationData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/cotizaciones/new")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al formulario
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Resumen de Cotización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Información del Cliente */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-amber-900 mb-3">Información del Cliente</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{quotationData.nombreCliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{quotationData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">{quotationData.telefono}</p>
              </div>
            </div>
          </div>

          {/* Información del Evento */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Información del Evento</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre del Evento</p>
                <p className="font-medium">{quotationData.nombreEvento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Evento</p>
                <p className="font-medium">{quotationData.tipoEvento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Número de Invitados</p>
                <p className="font-medium">{quotationData.numeroInvitados}</p>
              </div>
            </div>
          </div>

          {/* Selección de Espacio */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">Selección de Espacio</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Hotel</p>
                <p className="font-medium">{hotelName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Salón</p>
                <p className="font-medium">{salonName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Montaje</p>
                <p className="font-medium">{montajeName}</p>
              </div>
            </div>
          </div>

          {/* Fechas y Horarios */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Fechas y Horarios</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Fecha Inicial</p>
                <p className="font-medium">{quotationData.fechaInicial}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha Final</p>
                <p className="font-medium">{quotationData.fechaFinal}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hora Inicio</p>
                <p className="font-medium">{quotationData.horaInicio}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hora Fin</p>
                <p className="font-medium">{quotationData.horaFin}</p>
              </div>
            </div>
          </div>

          {/* Información de Costos */}
          <div>
            <h3 className="text-lg font-semibold text-cyan-900 mb-3">Información de Costos</h3>
            <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="font-medium">${quotationData.subtotal}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Impuestos</p>
                <p className="font-medium">${quotationData.impuestos}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Descuento %</p>
                <p className="font-medium">{quotationData.descuentoPorcentaje}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monto Descuento</p>
                <p className="font-medium">${quotationData.montoDescuento}</p>
              </div>
              <div className="md:col-span-2 border-t pt-3 mt-2">
                <p className="text-sm text-gray-500">Total Monto</p>
                <p className="text-2xl font-bold text-cyan-600">${quotationData.totalMonto}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones con PDF */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generar y Enviar Cotización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleDownloadPDF} className="flex-1 gap-2" variant="default">
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
            <Button onClick={handleSendEmail} className="flex-1 gap-2 bg-transparent" variant="outline">
              <Mail className="h-4 w-4" />
              Enviar por Correo
            </Button>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Descarga el PDF de la cotización o envíalo directamente por correo electrónico al cliente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
