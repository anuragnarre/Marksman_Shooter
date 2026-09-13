// apps/api/src/biometrics/biometrics.module.ts
import { Module } from '@nestjs/common';
import { BiometricsController } from './biometrics.controller';
import { BiometricsService } from './biometrics.service';
import { BiometricsAiService } from './biometrics-ai.service';
import { DeviceAuthGuard } from './guards/device-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, GatewayModule, AnalyticsModule, AuthModule],
  controllers: [BiometricsController],
  providers: [BiometricsService, BiometricsAiService, DeviceAuthGuard],
  exports: [BiometricsService],
})
export class BiometricsModule {}
