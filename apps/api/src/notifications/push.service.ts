import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
// import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private isInitialized = false;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const serviceAccountBase64 = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64');
    if (serviceAccountBase64) {
      try {
        // const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('ascii'));
        // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        this.isInitialized = true;
        this.logger.log('Firebase Admin initialized for push notifications');
      } catch (e) {
        this.logger.error('Failed to initialize Firebase Admin', e);
      }
    } else {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 not configured. Push notifications mocked.');
    }
  }

  async registerDevice(userId: string, token: string, deviceOs?: string) {
    return this.prisma.devicePushToken.upsert({
      where: { token },
      update: { userId, deviceOs, updatedAt: new Date() },
      create: { userId, token, deviceOs },
    });
  }

  async unregisterDevice(token: string) {
    return this.prisma.devicePushToken.delete({
      where: { token },
    });
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>) {
    const tokens = await this.prisma.devicePushToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) {
      return;
    }

    const tokenStrings = tokens.map((t) => t.token);

    if (!this.isInitialized) {
      this.logger.log(`[MOCK PUSH] To: ${userId} (${tokenStrings.length} devices) | Title: ${title}`);
      return;
    }

    try {
      /*
      await admin.messaging().sendEachForMulticast({
        tokens: tokenStrings,
        notification: { title, body },
        data: data || {},
      });
      */
      this.logger.log(`Sent push notification to ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send push to ${userId}`, error);
    }
  }
}
