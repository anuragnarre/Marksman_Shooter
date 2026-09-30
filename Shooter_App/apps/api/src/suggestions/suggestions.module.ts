// apps/api/src/suggestions/suggestions.module.ts
import { Module } from '@nestjs/common';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, AnalyticsModule],
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
})
export class SuggestionsModule {}
