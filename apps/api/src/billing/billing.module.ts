import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { OrganizationBillingController } from './organization-billing.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController, OrganizationBillingController],
  providers: [PaymentsService, StripeService, RazorpayService],
  exports: [PaymentsService],
})
export class BillingModule {}
