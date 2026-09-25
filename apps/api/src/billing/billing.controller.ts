import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  async checkout(
    @Body('userId') userId: string,
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('method') method: string,
  ) {
    return this.paymentsService.createPayment(userId, amount, currency, method);
  }

  @Get('dashboard')
  async getDashboard(@Query('rangeId') rangeId: string) {
    return this.paymentsService.getFinancialDashboard(rangeId);
  }
}
