import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post('tiers')
  @Roles('RANGE_ADMIN')
  createTier(@Body() createTierDto: { name: string; description?: string; monthlyPrice: number; maxActiveBookings: number; priorityBookingDays: number }) {
    return this.membershipsService.createMembershipTier(createTierDto);
  }

  @Get('tiers')
  @Roles('RANGE_ADMIN', 'STAFF')
  findAllTiers() {
    return this.membershipsService.getAllTiers();
  }

  @Post('subscriptions')
  @Roles('RANGE_ADMIN', 'STAFF')
  createSubscription(@Body() createSubDto: { userId: string; tierId: string; status: any; startDate: Date; endDate?: Date; organizationId?: string }) {
    return this.membershipsService.createSubscription(createSubDto);
  }

  @Get('subscriptions/user/:userId')
  @Roles('RANGE_ADMIN', 'STAFF')
  getUserSubscription(@Param('userId') userId: string) {
    return this.membershipsService.getUserSubscription(userId);
  }

  @Get('subscriptions')
  @Roles('RANGE_ADMIN', 'STAFF', 'RANGE_OPERATOR')
  getAllSubscriptions() {
    return this.membershipsService.getAllSubscriptions();
  }

  @Get('organizations')
  @Roles('RANGE_ADMIN', 'STAFF', 'RANGE_OPERATOR')
  getAllOrganizations() {
    return this.membershipsService.getAllOrganizations();
  }
}

