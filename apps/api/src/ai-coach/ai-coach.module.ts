// apps/api/src/ai-coach/ai-coach.module.ts
import { Module } from '@nestjs/common';
import { AiCoachController } from './ai-coach.controller';
import { AiCoachService } from './ai-coach.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AnalyticsModule, AuthModule],
  controllers: [AiCoachController],
  providers: [AiCoachService],
})
export class AiCoachModule {}
