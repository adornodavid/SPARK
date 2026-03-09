import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"
import {
  getQuotationEmailTemplate,
  getBookingConfirmationTemplate,
  getAgreementReminderTemplate,
} from "@/lib/email/templates"

export async function sendQuotationEmail(quotationId: string) {
  const supabase = await createClient()

  const { data: quotation } = await supabase
    .from("banquet_quotations")
    .select(`
      *,
      client:clients(name, email),
      hotel:hotels(name, address, phone)
    `)
    .eq("id", quotationId)
    .single()

  if (!quotation || !quotation.client?.email) {
    return { success: false }
  }

  const emailHtml = getQuotationEmailTemplate(quotation, quotation.client, quotation.hotel)

  return await sendEmail({
    to: quotation.client.email,
    subject: `Cotización ${quotation.folio} - ${quotation.event_type}`,
    html: emailHtml,
  })
}

export async function sendBookingConfirmation(bookingId: string) {
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from("room_bookings")
    .select(`
      *,
      client:clients(name, email),
      hotel:hotels(name, address, phone),
      room:rooms(room_number, category:room_categories(name))
    `)
    .eq("id", bookingId)
    .single()

  if (!booking || !booking.client?.email) {
    return { success: false }
  }

  const emailHtml = getBookingConfirmationTemplate(booking, booking.client, booking.hotel, booking.room)

  return await sendEmail({
    to: booking.client.email,
    subject: `Confirmación de Reservación ${booking.folio}`,
    html: emailHtml,
  })
}

export async function sendAgreementReminder(agreementId: string, daysUntilExpiry: number) {
  const supabase = await createClient()

  const { data: agreement } = await supabase
    .from("corporate_agreements")
    .select(`
      *,
      client:clients(name, email)
    `)
    .eq("id", agreementId)
    .single()

  if (!agreement || !agreement.client?.email) {
    return { success: false }
  }

  const emailHtml = getAgreementReminderTemplate(agreement, agreement.client, daysUntilExpiry)

  return await sendEmail({
    to: agreement.client.email,
    subject: `Recordatorio: Su convenio vence en ${daysUntilExpiry} días`,
    html: emailHtml,
  })
}

// Cron job function to check and send agreement reminders
export async function checkAgreementExpirations() {
  const supabase = await createClient()

  const today = new Date()
  const reminderDays = [30, 15, 7, 1] // Days before expiry to send reminders

  for (const days of reminderDays) {
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + days)
    const targetDateStr = targetDate.toISOString().split("T")[0]

    const { data: agreements } = await supabase
      .from("corporate_agreements")
      .select("id")
      .eq("status", "active")
      .eq("end_date", targetDateStr)

    if (agreements) {
      for (const agreement of agreements) {
        await sendAgreementReminder(agreement.id, days)

        // Log notification
        await supabase.from("notifications").insert({
          type: "agreement_expiry",
          title: `Convenio por vencer en ${days} días`,
          message: `El convenio vence el ${targetDateStr}`,
          related_id: agreement.id,
        })
      }
    }
  }
}
