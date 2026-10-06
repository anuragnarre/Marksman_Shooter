"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const app_controller_1 = require("./app.controller");
const auth_module_1 = require("./auth/auth.module");
const sessions_module_1 = require("./sessions/sessions.module");
const shots_module_1 = require("./shots/shots.module");
const analytics_module_1 = require("./analytics/analytics.module");
const planning_module_1 = require("./planning/planning.module");
const suggestions_module_1 = require("./suggestions/suggestions.module");
const coach_module_1 = require("./coach/coach.module");
const gateway_module_1 = require("./gateway/gateway.module");
const ai_coach_module_1 = require("./ai-coach/ai-coach.module");
const calendar_module_1 = require("./calendar/calendar.module");
const schedule_requests_module_1 = require("./schedule-requests/schedule-requests.module");
const performance_module_1 = require("./performance/performance.module");
const biometrics_module_1 = require("./biometrics/biometrics.module");
const events_module_1 = require("./events/events.module");
const equipment_module_1 = require("./equipment/equipment.module");
const ranges_module_1 = require("./ranges/ranges.module");
const ballistics_module_1 = require("./ballistics/ballistics.module");
const competitions_module_1 = require("./competitions/competitions.module");
const shooter_profile_module_1 = require("./shooter-profile/shooter-profile.module");
const organizations_module_1 = require("./organizations/organizations.module");
const memberships_module_1 = require("./memberships/memberships.module");
const safety_module_1 = require("./safety/safety.module");
const range_operations_module_1 = require("./range-operations/range-operations.module");
const notifications_module_1 = require("./notifications/notifications.module");
const roles_dashboard_module_1 = require("./roles-dashboard/roles-dashboard.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const billing_module_1 = require("./billing/billing.module");
const export_module_1 = require("./export/export.module");
const audit_log_interceptor_1 = require("./safety/audit-log.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../apps/api/.env', 'apps/api/.env'] }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            ...(process.env.REDIS_HOST
                ? [bull_1.BullModule.forRoot({
                        redis: {
                            host: process.env.REDIS_HOST,
                            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
                        },
                    })]
                : []),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            shooter_profile_module_1.ShooterProfileModule,
            auth_module_1.AuthModule,
            sessions_module_1.SessionsModule,
            shots_module_1.ShotsModule,
            analytics_module_1.AnalyticsModule,
            planning_module_1.PlanningModule,
            suggestions_module_1.SuggestionsModule,
            coach_module_1.CoachModule,
            gateway_module_1.GatewayModule,
            ai_coach_module_1.AiCoachModule,
            calendar_module_1.CalendarModule,
            schedule_requests_module_1.ScheduleRequestsModule,
            performance_module_1.PerformanceModule,
            biometrics_module_1.BiometricsModule,
            events_module_1.EventsModule,
            equipment_module_1.EquipmentModule,
            ranges_module_1.RangesModule,
            ballistics_module_1.BallisticsModule,
            competitions_module_1.CompetitionsModule,
            organizations_module_1.OrganizationsModule,
            memberships_module_1.MembershipsModule,
            safety_module_1.SafetyModule,
            range_operations_module_1.RangeOperationsModule,
            notifications_module_1.NotificationsModule,
            roles_dashboard_module_1.RolesDashboardModule,
            webhooks_module_1.WebhooksModule,
            billing_module_1.BillingModule,
            export_module_1.ExportModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_log_interceptor_1.AuditLogInterceptor,
            }
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map