import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('visits/:visitId/invoice')
  createInvoice(@Param('visitId') visitId: string) {
    return this.billingService.createInvoiceFromVisit(visitId);
  }

  @Get('invoices/:id')
  findInvoice(@Param('id') id: string) {
    return this.billingService.findInvoice(id);
  }

  @Post('invoices/:id/payments')
  createPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.billingService.createPayment(id, dto);
  }
}
