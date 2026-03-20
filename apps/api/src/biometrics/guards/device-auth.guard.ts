// apps/api/src/biometrics/guards/device-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey =
      request.headers['x-device-key'] ??
      request.query?.key;

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Missing X-Device-Key header');
    }

    const device = await this.prisma.deviceRegistration.findUnique({
      where: { apiKey },
    });

    if (!device || !device.isActive) {
      throw new UnauthorizedException('Invalid or inactive device key');
    }

    // Update lastSeenAt (fire-and-forget)
    this.prisma.deviceRegistration
      .update({ where: { id: device.id }, data: { lastSeenAt: new Date() } })
      .catch(() => {});

    request.device = device;
    request.deviceUserId = device.userId;
    return true;
  }
}
