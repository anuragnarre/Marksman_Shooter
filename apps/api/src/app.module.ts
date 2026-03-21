// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { ShotsModule } from './shots/shots.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { CoachModule } from './coach/coach.module';
import { GatewayModule } from './gateway/gateway.module';
import { AiCoachModule } from './ai-coach/ai-coach.module';
import { CalendarModule } from './calendar/calendar.module';
import { ScheduleRequestsModule } from './schedule-requests/schedule-requests.module';
import { PerformanceModule } from './performance/performance.module';
import { BiometricsModule } from './biometrics/biometrics.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
    PrismaModule,
    AuthModule,
    SessionsModule,
    ShotsModule,
    AnalyticsModule,
    SuggestionsModule,
    CoachModule,
    GatewayModule,
    AiCoachModule,
    CalendarModule,
    ScheduleRequestsModule,
    PerformanceModule,
    BiometricsModule,
    EventsModule,
  ],
})
export class AppModule {}
