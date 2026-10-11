import { Module } from '@nestjs/common';
import { RangeOperationsService } from './range-operations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TelemetryGateway } from './telemetry/telemetry.gateway';
import { RangeOperationsController } from './range-operations.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [PrismaModule, GatewayModule],
  providers: [RangeOperationsService, TelemetryGateway],
  exports: [RangeOperationsService],
  controllers: [RangeOperationsController]
})
export class RangeOperationsModule {}
