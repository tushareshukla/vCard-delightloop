export interface EventCampaignData {
     campaignName: string
     eventName: string
     eventDate: string
     eventType: string
     recipientSource: "csv" | "eventbrite" | "contactList" | ""
     csvFile: File | null
     eventbriteEventId: string
     contactListIds: string[]
     selectedGiftIds: string[]
     budget: {
       perRecipient: number
       total: number
     }
     message: string
     logoUrl: string
     templateId: string
   }
   
   