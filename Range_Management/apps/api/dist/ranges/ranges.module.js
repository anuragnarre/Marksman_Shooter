"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangesModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("../prisma/prisma.module");
const ranges_controller_1 = require("./ranges.controller");
const bookings_controller_1 = require("./bookings.controller");
const ranges_service_1 = require("./ranges.service");
const booking_service_1 = require("./booking.service");
const weather_service_1 = require("./weather.service");
const range_analytics_service_1 = require("./range-analytics.service");
const announcement_service_1 = require("./announcement.service");
let RangesModule = class RangesModule {
};
exports.RangesModule = RangesModule;
exports.RangesModule = RangesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, schedule_1.ScheduleModule.forRoot()],
        controllers: [ranges_controller_1.RangesController, bookings_controller_1.BookingsController],
        providers: [
            ranges_service_1.RangesService,
            booking_service_1.BookingService,
            weather_service_1.WeatherService,
            range_analytics_service_1.RangeAnalyticsService,
            announcement_service_1.AnnouncementService,
        ],
        exports: [ranges_service_1.RangesService, booking_service_1.BookingService, weather_service_1.WeatherService, range_analytics_service_1.RangeAnalyticsService],
    })
], RangesModule);
//# sourceMappingURL=ranges.module.js.map