import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';

// apps/api/src/app.module.ts
// ... existing imports ...
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { ShotsModule } from './shots/shots.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PlanningModule } from './planning/planning.module';
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
import { CompetitionsModule } from './competitions/competitions.module';

import { ShooterProfileModule } from './shooter-profile/shooter-profile.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembershipsModule } from './memberships/memberships.module';
import { SafetyModule } from './safety/safety.module';
import { RangeOperationsModule } from './range-operations/range-operations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RolesDashboardModule } from './roles-dashboard/roles-dashboard.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { BillingModule } from './billing/billing.module';
import { ExportModule } from './export/export.module';
import { AuditLogInterceptor } from './safety/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../apps/api/.env', 'apps/api/.env'] }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    // BUG-06: Only register Bull/Redis if REDIS_HOST is explicitly configured.
    // Without this guard, the app crashes on startup in dev environments without Redis.
    ...(process.env.REDIS_HOST
      ? [BullModule.forRoot({
          redis: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
          },
        })]
      : []),
    ScheduleModule.forRoot(),
    PrismaModule,
    ShooterProfileModule,
    AuthModule,
    SessionsModule,
    ShotsModule,
    AnalyticsModule,
    PlanningModule,
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
    CompetitionsModule,
    OrganizationsModule,
    MembershipsModule,
    SafetyModule,
    RangeOperationsModule,
    NotificationsModule,
    RolesDashboardModule,
    WebhooksModule,
    BillingModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    }
  ],
})
export class AppModule {}
