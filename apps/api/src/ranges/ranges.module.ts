import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { RangesController } from './ranges.controller';
import { BookingsController } from './bookings.controller';
import { RangesService } from './ranges.service';
import { BookingService } from './booking.service';
import { WeatherService } from './weather.service';
import { RangeAnalyticsService } from './range-analytics.service';
import { AnnouncementService } from './announcement.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [RangesController, BookingsController],
  providers: [
    RangesService,
    BookingService,
    WeatherService,
    RangeAnalyticsService,
    AnnouncementService,
  ],
  exports: [RangesService, BookingService, WeatherService, RangeAnalyticsService],
})
export class RangesModule {}
