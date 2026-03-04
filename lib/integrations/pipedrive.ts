// Pipedrive integration placeholder
// To be implemented when user provides API key

export interface PipedriveConfig {
  apiToken: string
  companyDomain: string
}

export class PipedriveClient {
  private config: PipedriveConfig

  constructor(config: PipedriveConfig) {
    this.config = config
  }

  async createDeal(data: {
    title: string
    value: number
    currency: string
    personId?: number
    orgId?: number
  }) {
    // TODO: Implement Pipedrive API call
    console.log("[Pipedrive] Creating deal:", data)

    // Example implementation:
    // const response = await fetch(
    //   `https://${this.config.companyDomain}.pipedrive.com/api/v1/deals?api_token=${this.config.apiToken}`,
    //   {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data),
    //   }
    // )
    // return await response.json()

    return { success: true, id: "mock-deal-id" }
  }

  async createPerson(data: {
    name: string
    email?: string
    phone?: string
    orgId?: number
  }) {
    console.log("[Pipedrive] Creating person:", data)
    return { success: true, id: "mock-person-id" }
  }

  async createOrganization(data: {
    name: string
    address?: string
  }) {
    console.log("[Pipedrive] Creating organization:", data)
    return { success: true, id: "mock-org-id" }
  }

  async updateDealStage(dealId: string, stageId: number) {
    console.log("[Pipedrive] Updating deal stage:", { dealId, stageId })
    return { success: true }
  }
}

// Sync quotation to Pipedrive
export async function syncQuotationToPipedrive(quotationId: string) {
  // TODO: Implement when Pipedrive is configured
  console.log("[Pipedrive] Would sync quotation:", quotationId)

  // Example workflow:
  // 1. Get quotation data
  // 2. Create/update person in Pipedrive
  // 3. Create deal in Pipedrive
  // 4. Link deal to quotation in database

  return { success: true }
}
