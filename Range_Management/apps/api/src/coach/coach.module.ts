// apps/api/src/coach/coach.module.ts
import { Module } from '@nestjs/common';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [AuthModule, GatewayModule],
  controllers: [CoachController],
  providers: [CoachService],
})
export class CoachModule {}
