import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { RangesService } from './ranges.service';
import { CreateRangeDto, CreateLaneDto, WalkInGuestDto, BookLaneDto } from './dto/range.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('ranges')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RangesController {
  constructor(private readonly rangesService: RangesService) {}

  @Post()
  @Roles('RANGE_OPERATOR')
  createRange(@Request() req, @Body() dto: CreateRangeDto) {
    return this.rangesService.createRange(req.user.id, dto);
  }

  @Get()
  @Roles('RANGE_OPERATOR')
  getMyRanges(@Request() req) {
    return this.rangesService.getMyRanges(req.user.id);
  }

  @Get(':id')
  getRangeDetails(@Param('id') id: string) {
    return this.rangesService.getRangeDetails(id);
  }

  @Post(':id/lanes')
  @Roles('RANGE_OPERATOR')
  createLane(@Param('id') id: string, @Body() dto: CreateLaneDto) {
    return this.rangesService.createLane(id, dto);
  }

  @Post(':id/walk-in')
  @Roles('RANGE_OPERATOR')
  registerWalkInGuest(@Param('id') id: string, @Body() dto: WalkInGuestDto) {
    return this.rangesService.registerWalkInGuest(id, dto);
  }

  @Put('lanes/:laneId/link-session')
  linkSessionToLane(@Param('laneId') laneId: string, @Body('sessionId') sessionId: string) {
    return this.rangesService.linkSessionToLane(laneId, sessionId);
  }

  @Put('lanes/:laneId/clear')
  @Roles('RANGE_OPERATOR')
  clearLane(@Param('laneId') laneId: string) {
    return this.rangesService.clearLane(laneId);
  }

  @Post(':id/bookings')
  bookLane(@Param('id') id: string, @Body() dto: BookLaneDto) {
    return this.rangesService.bookLane(id, dto);
  }
}
