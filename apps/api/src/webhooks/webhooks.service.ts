import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway,
  ) {}

  async processTargetPayload(payload: any) {
    // Example payload from an electronic target system: 
    // { targetId: "A1", score: 10.5, x: 1.2, y: -0.5, timestamp: "..." }
    try {
      const { targetId, score, x, y } = payload;
      
      // We could map targetId to a lane or active session
      // For now, just broadcast the shot event to whoever is listening on that lane
      this.eventsGateway.emitShotDetected("default-range", { laneId: targetId, score, x, y, timestamp: new Date() } as any);
      
      this.logger.log(`Processed electronic target payload: Target ${targetId} scored ${score}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error processing target payload', error);
      throw error;
    }
  }

  async processPaymentPayload(payload: any) {
    // Dummy integration for payment (e.g. Stripe)
    try {
      const { type, data } = payload;
      if (type === 'payment_intent.succeeded') {
        const amount = data.object.amount;
        const customerEmail = data.object.receipt_email;
        this.logger.log(`Payment succeeded for ${customerEmail}: ${amount}`);
        // Update booking or membership status in database here
      }
      return { success: true };
    } catch (error) {
      this.logger.error('Error processing payment payload', error);
      throw error;
    }
  }

  async processGenericPayload(source: string, payload: any) {
    this.logger.log(`Processed generic payload from ${source}`);
    return { success: true };
  }
}
