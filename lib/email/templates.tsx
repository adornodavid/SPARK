// Email templates for different notifications
// SPARK Brand Palette (inline HTML safe):
//   Primary bg: #1a1a1a | Accent: #a3e635 (lime-400) | Bright: #e6ff00
//   Text on dark: #ffffff | Text on light: #1a1a1a | Muted: #6b7280 | Light bg: #f9fafb

export function getQuotationEmailTemplate(quotation: any, client: any, hotel: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
          <tr>
            <td align="center" style="padding: 30px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #1a1a1a; padding: 24px 32px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td>
                          <h1 style="margin: 0; color: #a3e635; font-size: 28px; font-weight: 700; letter-spacing: 2px;">SPARK</h1>
                          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 12px;">Comercial y Banquetes</p>
                        </td>
                        <td align="right">
                          <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">Cotizaci&oacute;n de Evento</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 16px; color: #1a1a1a; font-size: 15px;">Estimado/a ${client.name},</p>
                    <p style="margin: 0 0 24px; color: #4b5563; font-size: 14px; line-height: 1.6;">Le enviamos la cotizaci&oacute;n para su evento:</p>

                    <!-- Details Card -->
                    <table role="presentation" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0 0 12px; color: #a3e635; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Detalles del Evento</p>
                          <table role="presentation" width="100%">
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Folio:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${quotation.folio}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Hotel:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${hotel.name}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Tipo de Evento:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${quotation.event_type}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Fecha:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${new Date(quotation.event_date).toLocaleDateString("es-MX")}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Personas:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${quotation.number_of_people}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0 0; color: #1a1a1a; font-size: 14px; font-weight: 700;">Total:</td>
                              <td align="right" style="padding: 12px 0 0; font-size: 20px; font-weight: 700; color: #65a30d;">$${quotation.total_amount?.toLocaleString()}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${
                      quotation.notes
                        ? `
                    <table role="presentation" width="100%" style="margin-top: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                      <tr>
                        <td style="padding: 16px 24px;">
                          <p style="margin: 0 0 8px; color: #a3e635; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Notas</p>
                          <p style="margin: 0; color: #4b5563; font-size: 13px;">${quotation.notes}</p>
                        </td>
                      </tr>
                    </table>
                    `
                        : ""
                    }

                    <p style="margin: 24px 0 20px; color: #4b5563; font-size: 14px;">Si tiene alguna pregunta o desea proceder con la reservaci&oacute;n, no dude en contactarnos.</p>

                    <table role="presentation" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/quotation/${quotation.id}" style="display: inline-block; padding: 14px 28px; background-color: #1a1a1a; color: #a3e635; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Ver Cotizaci&oacute;n Completa</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #1a1a1a; padding: 20px 32px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #a3e635; font-size: 16px; font-weight: 700; letter-spacing: 2px;">SPARK</p>
                          <p style="margin: 2px 0 0; color: #6b7280; font-size: 10px;">Comercial y Banquetes MGHM</p>
                        </td>
                        <td align="right">
                          <p style="margin: 0; color: #6b7280; font-size: 11px;">Este es un correo autom&aacute;tico, por favor no responder.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
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
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
          <tr>
            <td align="center" style="padding: 30px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #1a1a1a; padding: 24px 32px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td>
                          <h1 style="margin: 0; color: #a3e635; font-size: 28px; font-weight: 700; letter-spacing: 2px;">SPARK</h1>
                          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 12px;">Comercial y Banquetes</p>
                        </td>
                        <td align="right">
                          <p style="margin: 0; color: #a3e635; font-size: 18px; font-weight: 600;">&#10003; Confirmada</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 15px;">Estimado/a ${client.name},</p>
                    <p style="margin: 0 0 24px; color: #4b5563; font-size: 14px; line-height: 1.6;">Su reservaci&oacute;n ha sido confirmada exitosamente.</p>

                    <!-- Details Card -->
                    <table role="presentation" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0 0 12px; color: #a3e635; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Detalles de su Reservaci&oacute;n</p>
                          <table role="presentation" width="100%">
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Folio:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${booking.folio}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Hotel:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${hotel.name}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Habitaci&oacute;n:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${room.room_number} - ${room.category?.name}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Check-in:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${new Date(booking.check_in_date).toLocaleDateString("es-MX")}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Check-out:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${new Date(booking.check_out_date).toLocaleDateString("es-MX")}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Noches:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${booking.number_of_nights}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Hu&eacute;spedes:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${booking.number_of_guests}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0 0; color: #1a1a1a; font-size: 14px; font-weight: 700;">Total:</td>
                              <td align="right" style="padding: 12px 0 0; font-size: 20px; font-weight: 700; color: #65a30d;">$${booking.total_amount?.toLocaleString()}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Important Notice -->
                    <table role="presentation" width="100%" style="margin-top: 20px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #a3e635;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0; color: #1a1a1a; font-size: 13px;">
                            <strong>Importante:</strong> Por favor llegue a partir de las 3:00 PM para el check-in.
                            La hora de check-out es a las 12:00 PM.
                          </p>
                        </td>
                      </tr>
                    </table>

                    ${
                      booking.special_requests
                        ? `
                    <table role="presentation" width="100%" style="margin-top: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                      <tr>
                        <td style="padding: 16px 24px;">
                          <p style="margin: 0 0 8px; color: #a3e635; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Solicitudes Especiales</p>
                          <p style="margin: 0; color: #4b5563; font-size: 13px;">${booking.special_requests}</p>
                        </td>
                      </tr>
                    </table>
                    `
                        : ""
                    }

                    <p style="margin: 24px 0 0; color: #4b5563; font-size: 14px;">Esperamos darle la bienvenida pronto.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #1a1a1a; padding: 20px 32px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #a3e635; font-size: 16px; font-weight: 700; letter-spacing: 2px;">SPARK</p>
                          <p style="margin: 2px 0 0; color: #6b7280; font-size: 10px;">Comercial y Banquetes MGHM</p>
                        </td>
                        <td align="right" valign="top">
                          <p style="margin: 0 0 2px; color: #d1d5db; font-size: 11px;">${hotel.name}</p>
                          <p style="margin: 0 0 2px; color: #9ca3af; font-size: 10px;">${hotel.address}</p>
                          <p style="margin: 0; color: #9ca3af; font-size: 10px;">Tel: ${hotel.phone}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
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
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
          <tr>
            <td align="center" style="padding: 30px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #1a1a1a; padding: 24px 32px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td>
                          <h1 style="margin: 0; color: #a3e635; font-size: 28px; font-weight: 700; letter-spacing: 2px;">SPARK</h1>
                          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 12px;">Comercial y Banquetes</p>
                        </td>
                        <td align="right">
                          <p style="margin: 0; color: #f59e0b; font-size: 14px; font-weight: 600;">Recordatorio de Convenio</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 15px;">Estimado/a ${client.name},</p>

                    <!-- Warning Banner -->
                    <table role="presentation" width="100%" style="background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                            Su convenio corporativo vence en ${daysUntilExpiry} d&iacute;a${daysUntilExpiry !== 1 ? "s" : ""}.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Agreement Details -->
                    <table role="presentation" width="100%" style="margin-top: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0 0 12px; color: #1a1a1a; font-size: 16px; font-weight: 600;">${agreement.name}</p>
                          <table role="presentation" width="100%">
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><strong>Fecha de vencimiento:</strong></td>
                              <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1a1a1a; font-size: 13px;">${new Date(agreement.end_date).toLocaleDateString("es-MX")}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;"><strong>Descuento actual:</strong></td>
                              <td align="right" style="padding: 8px 0; color: #65a30d; font-size: 16px; font-weight: 700;">${agreement.discount_percentage}%</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 8px; color: #4b5563; font-size: 14px;">Le invitamos a renovar su convenio para seguir disfrutando de los beneficios especiales.</p>
                    <p style="margin: 0; color: #4b5563; font-size: 14px;">Por favor cont&aacute;ctenos para m&aacute;s informaci&oacute;n sobre la renovaci&oacute;n.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #1a1a1a; padding: 20px 32px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #a3e635; font-size: 16px; font-weight: 700; letter-spacing: 2px;">SPARK</p>
                          <p style="margin: 2px 0 0; color: #6b7280; font-size: 10px;">Comercial y Banquetes MGHM</p>
                        </td>
                        <td align="right">
                          <p style="margin: 0; color: #6b7280; font-size: 11px;">Este es un correo autom&aacute;tico, por favor no responder.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}
