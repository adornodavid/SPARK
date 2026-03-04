// Email templates for different notifications

export function getQuotationEmailTemplate(quotation: any, client: any, hotel: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .footer { text-center; padding: 20px; font-size: 12px; color: #6b7280; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cotización de Evento</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${client.name},</p>
            <p>Le enviamos la cotización para su evento:</p>
            
            <div class="details">
              <h3>Detalles del Evento</h3>
              <div class="detail-row">
                <span><strong>Folio:</strong></span>
                <span>${quotation.folio}</span>
              </div>
              <div class="detail-row">
                <span><strong>Hotel:</strong></span>
                <span>${hotel.name}</span>
              </div>
              <div class="detail-row">
                <span><strong>Tipo de Evento:</strong></span>
                <span>${quotation.event_type}</span>
              </div>
              <div class="detail-row">
                <span><strong>Fecha:</strong></span>
                <span>${new Date(quotation.event_date).toLocaleDateString("es-MX")}</span>
              </div>
              <div class="detail-row">
                <span><strong>Personas:</strong></span>
                <span>${quotation.number_of_people}</span>
              </div>
              <div class="detail-row">
                <span><strong>Total:</strong></span>
                <span style="font-size: 18px; font-weight: bold; color: #2563eb;">$${quotation.total_amount?.toLocaleString()}</span>
              </div>
            </div>

            ${
              quotation.notes
                ? `
              <div class="details">
                <h3>Notas</h3>
                <p>${quotation.notes}</p>
              </div>
            `
                : ""
            }

            <p>Si tiene alguna pregunta o desea proceder con la reservación, no dude en contactarnos.</p>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/quotation/${quotation.id}" class="button">Ver Cotización Completa</a>
            </center>
          </div>
          <div class="footer">
            <p>Portal Milenium Hotels</p>
            <p>Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getBookingConfirmationTemplate(booking: any, client: any, hotel: any, room: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #16a34a; color: white; padding: 20px; text-center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .footer { text-center; padding: 20px; font-size: 12px; color: #6b7280; }
          .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .highlight { background-color: #dcfce7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Reservación Confirmada</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${client.name},</p>
            <p>Su reservación ha sido confirmada exitosamente.</p>
            
            <div class="details">
              <h3>Detalles de su Reservación</h3>
              <div class="detail-row">
                <span><strong>Folio:</strong></span>
                <span>${booking.folio}</span>
              </div>
              <div class="detail-row">
                <span><strong>Hotel:</strong></span>
                <span>${hotel.name}</span>
              </div>
              <div class="detail-row">
                <span><strong>Habitación:</strong></span>
                <span>${room.room_number} - ${room.category?.name}</span>
              </div>
              <div class="detail-row">
                <span><strong>Check-in:</strong></span>
                <span>${new Date(booking.check_in_date).toLocaleDateString("es-MX")}</span>
              </div>
              <div class="detail-row">
                <span><strong>Check-out:</strong></span>
                <span>${new Date(booking.check_out_date).toLocaleDateString("es-MX")}</span>
              </div>
              <div class="detail-row">
                <span><strong>Noches:</strong></span>
                <span>${booking.number_of_nights}</span>
              </div>
              <div class="detail-row">
                <span><strong>Huéspedes:</strong></span>
                <span>${booking.number_of_guests}</span>
              </div>
              <div class="detail-row">
                <span><strong>Total:</strong></span>
                <span style="font-size: 18px; font-weight: bold; color: #16a34a;">$${booking.total_amount?.toLocaleString()}</span>
              </div>
            </div>

            <div class="highlight">
              <strong>Importante:</strong> Por favor llegue a partir de las 3:00 PM para el check-in. 
              La hora de check-out es a las 12:00 PM.
            </div>

            ${
              booking.special_requests
                ? `
              <div class="details">
                <h3>Solicitudes Especiales</h3>
                <p>${booking.special_requests}</p>
              </div>
            `
                : ""
            }

            <p>Esperamos darle la bienvenida pronto.</p>
          </div>
          <div class="footer">
            <p>${hotel.name}</p>
            <p>${hotel.address}</p>
            <p>Tel: ${hotel.phone}</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getAgreementReminderTemplate(agreement: any, client: any, daysUntilExpiry: number) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .footer { text-center; padding: 20px; font-size: 12px; color: #6b7280; }
          .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠ Recordatorio de Convenio</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${client.name},</p>
            
            <div class="warning">
              <strong>Su convenio corporativo vence en ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? "s" : ""}.</strong>
            </div>

            <div class="details">
              <h3>${agreement.name}</h3>
              <p><strong>Fecha de vencimiento:</strong> ${new Date(agreement.end_date).toLocaleDateString("es-MX")}</p>
              <p><strong>Descuento actual:</strong> ${agreement.discount_percentage}%</p>
            </div>

            <p>Le invitamos a renovar su convenio para seguir disfrutando de los beneficios especiales.</p>
            <p>Por favor contáctenos para más información sobre la renovación.</p>
          </div>
          <div class="footer">
            <p>Portal Milenium Hotels</p>
          </div>
        </div>
      </body>
    </html>
  `
}
