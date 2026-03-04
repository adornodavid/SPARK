// WhatsApp Business API integration placeholder
// To be implemented when user configures Meta Business account

export interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
}

export class WhatsAppClient {
  private config: WhatsAppConfig

  constructor(config: WhatsAppConfig) {
    this.config = config
  }

  async sendMessage(to: string, message: string) {
    console.log("[WhatsApp] Sending message:", { to, message })

    // TODO: Implement WhatsApp Business API call
    // const response = await fetch(
    //   `https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${this.config.accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       messaging_product: 'whatsapp',
    //       to: to,
    //       type: 'text',
    //       text: { body: message },
    //     }),
    //   }
    // )
    // return await response.json()

    return { success: true, messageId: "mock-message-id" }
  }

  async sendTemplate(to: string, templateName: string, parameters: any[]) {
    console.log("[WhatsApp] Sending template:", { to, templateName, parameters })
    return { success: true, messageId: "mock-message-id" }
  }
}

// Send quotation via WhatsApp
export async function sendQuotationWhatsApp(quotationId: string, phoneNumber: string) {
  console.log("[WhatsApp] Would send quotation:", { quotationId, phoneNumber })

  // TODO: Implement when WhatsApp is configured
  // Example workflow:
  // 1. Get quotation data
  // 2. Format message with quotation details
  // 3. Send via WhatsApp Business API

  return { success: true }
}
