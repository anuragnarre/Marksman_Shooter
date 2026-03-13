// apps/api/src/schedule-requests/schedule-requests.module.ts
import { Module } from '@nestjs/common';
import { ScheduleRequestsController } from './schedule-requests.controller';
import { ScheduleRequestsService } from './schedule-requests.service';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [AuthModule, GatewayModule],
  controllers: [ScheduleRequestsController],
  providers: [ScheduleRequestsService],
})
export class ScheduleRequestsModule {}
