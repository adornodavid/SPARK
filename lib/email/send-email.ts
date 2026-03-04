// Email sending utility using Gmail (Resend can be added later)
// For now, this is a placeholder structure for email notifications

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions) {
  // TODO: Implement with Resend or Gmail API
  // For now, log to console for development
  console.log("[Email] Sending email:", {
    to: options.to,
    subject: options.subject,
    from: options.from || "Portal Milenium <noreply@milenium.com>",
  })

  // In production, you would use Resend:
  // const { data, error } = await resend.emails.send({
  //   from: options.from || 'Portal Milenium <noreply@milenium.com>',
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  // })

  return { success: true }
}
