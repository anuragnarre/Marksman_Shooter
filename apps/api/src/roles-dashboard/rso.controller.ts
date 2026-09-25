import { Controller, Post, Body, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('rso')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RSO')
export class RsoController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('cold-range')
  async declareColdRange(@Body('rangeId') rangeId: string) {
    // Notify all members of cold range
    await this.notificationsService.createNotification({
      userId: 'ALL_MEMBERS', // Abstracted — in real impl, broadcast to all range members
      type: 'SYSTEM_ALERT',
      title: 'COLD RANGE DECLARED',
      body: `Range ${rangeId} has been declared COLD. Cease fire immediately.`,
      metadata: { rangeId },
    });
    return { message: `Range ${rangeId} is now COLD.`, status: 'COLD_RANGE' };
  }

  @Post('scan-qr')
  async scanQrCode(@Body('qrPayload') qrPayload: string) {
    return { valid: true, shooterId: 'mock-shooter-id' };
  }
}
