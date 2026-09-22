import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BookingWhatsAppPayload {
  pocName: string;
  pocPhone: string;
  homeownerName: string;
  homeownerPhone: string;
  skillRequired: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  dailyRate: number;
  totalLaborAmount: number;
  workDescription: string;
  bookingId: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private token: string | undefined;
  private phoneId: string | undefined;

  constructor(private config: ConfigService) {
    this.token = this.config.get<string>('WHATSAPP_API_TOKEN');
    this.phoneId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
  }

  /**
   * Dispatches WhatsApp booking request to the POC/Mistri
   */
  async sendBookingRequestToPoc(payload: BookingWhatsAppPayload): Promise<{ success: boolean; simulated?: boolean }> {
    const formattedMessage = `
🏠 *नया काम मिला है - HOUSY BOOKING REQUEST*
------------------------------------------------
नमस्ते *${payload.pocName}* जी,
एक नए मकान मालिक को आपकी टीम की आवश्यकता है:

👤 *मकान मालिक:* ${payload.homeownerName}
📍 *तारीख:* ${payload.startDate} से ${payload.endDate} (${payload.daysCount} दिन)
🔨 *काम का प्रकार:* ${payload.skillRequired}
💰 *दहाड़ी:* ₹${payload.dailyRate}/दिन (कुल अनुमानित: ₹${payload.totalLaborAmount})
📝 *काम का विवरण:* ${payload.workDescription}

👉 *स्वीकार करने के लिए YES लिखकर भेजें*
👉 *अस्वीकार करने के लिए NO लिखकर भेजें*
Booking Ref: ${payload.bookingId}
------------------------------------------------
Housy Bareilly Partner Support: +91 98370 00000
    `.trim();

    this.logger.log(`[WHATSAPP DISPATCH -> POC: ${payload.pocPhone}]:\n${formattedMessage}`);

    // If Meta API credentials are configured, execute live HTTP POST
    if (this.token && this.phoneId && this.token !== 'your-whatsapp-token-here') {
      try {
        const cleanPhone = payload.pocPhone.replace(/\+/g, '');
        const response = await fetch(`https://graph.facebook.com/v20.0/${this.phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: false, body: formattedMessage },
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          this.logger.error('WhatsApp API Error:', errData);
          return { success: false };
        }
        return { success: true };
      } catch (err: any) {
        this.logger.error('Failed to post to WhatsApp API:', err.message);
        return { success: false };
      }
    }

    // Default simulation for development & offline environments
    return { success: true, simulated: true };
  }

  /**
   * Notify homeowner of booking status update (e.g. accepted, in progress)
   */
  async sendStatusUpdateToHomeowner(params: {
    homeownerPhone: string;
    homeownerName: string;
    pocName: string;
    status: string;
    bookingId: string;
  }): Promise<{ success: boolean; simulated?: boolean }> {
    const statusMessages: Record<string, string> = {
      accepted: `🎉 *Booking Confirmed!* ${params.pocName} has accepted your renovation booking request. You can now coordinate directly or via in-app chat.`,
      declined: `⚠️ *Booking Update:* ${params.pocName} is currently unavailable for those dates. Browse other verified POCs in Bareilly on Housy.`,
      active: `🔨 *Work Started:* Your renovation work with ${params.pocName} has officially commenced today. Track daily photos in your Project Dashboard.`,
      completed: `✅ *Work Completed:* ${params.pocName} marked the work as completed. Please leave a review to help other homeowners!`,
    };

    const text = statusMessages[params.status] || `Your booking status has been updated to: ${params.status}`;
    this.logger.log(`[WHATSAPP DISPATCH -> HOMEOWNER: ${params.homeownerPhone}]:\n${text}`);

    return { success: true, simulated: true };
  }
}
