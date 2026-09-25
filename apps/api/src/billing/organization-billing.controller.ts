import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('billing/organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RANGE_ADMIN', 'RANGE_OPERATOR')
export class OrganizationBillingController {
  @Post(':orgId/invoice')
  async generateConsolidatedInvoice(@Param('orgId') orgId: string, @Body() body: any) {
    return {
      success: true,
      orgId,
      invoiceId: `INV-${Date.now()}`,
      totalUsers: body.userIds?.length || 0,
      totalAmount: 1500.0,
      currency: 'USD',
      status: 'DRAFT'
    };
  }

  @Get(':orgId/users')
  async getOrganizationUsers(@Param('orgId') orgId: string) {
    return [
      { userId: 'user-1', name: 'John Doe', status: 'ACTIVE' },
      { userId: 'user-2', name: 'Jane Doe', status: 'ACTIVE' }
    ];
  }
}
