import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from '../ranges/booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@shooting-platform/shared-types';
import { CreateBookingDto, CancelBookingDto, CheckInBookingDto } from '../ranges/dto/booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingService: BookingService) {}

  /** 2.2.4 POST /bookings — create booking (or auto-join waitlist) */
  @Post()
  @ApiOperation({ summary: '2.2.4 Create a booking for a time slot' })
  createBooking(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(user.sub, dto);
  }

  /** 2.2.4 GET /bookings/my */
  @Get('my')
  @ApiOperation({ summary: '2.2.4 Get my bookings' })
  getMyBookings(@CurrentUser() user: JwtPayload) {
    return this.bookingService.getMyBookings(user.sub);
  }

  /** 2.2.4 PATCH /bookings/:id/cancel */
  @Patch(':id/cancel')
  @ApiOperation({ summary: '2.2.4 Cancel a booking (notifies waitlist)' })
  cancelBooking(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancelBooking(id, user.sub, dto);
  }

  /** 2.2.4 POST /bookings/:id/check-in — RSO/STAFF marks arrival */
  @Post(':id/check-in')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF')
  @ApiOperation({ summary: '2.2.4 Check in a shooter at the gate' })
  checkIn(@Param('id') id: string, @Body() dto: CheckInBookingDto) {
    return this.bookingService.checkInBooking(id, dto);
  }
}
