import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';

// apps/api/src/app.module.ts
// ... existing imports ...
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
import { EquipmentModule } from './equipment/equipment.module';
import { RangesModule } from './ranges/ranges.module';
import { BallisticsModule } from './ballistics/ballistics.module';

import { ShooterProfileModule } from './shooter-profile/shooter-profile.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembershipsModule } from './memberships/memberships.module';
import { SafetyModule } from './safety/safety.module';
import { RangeOperationsModule } from './range-operations/range-operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../apps/api/.env', 'apps/api/.env'] }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ShooterProfileModule,
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
    EquipmentModule,
    RangesModule,
    BallisticsModule,
    OrganizationsModule,
    MembershipsModule,
    SafetyModule,
    RangeOperationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
