import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ROLES } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BillingService } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // UC-14
  @Post('visits/:visitId/invoice')
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLES.CASHIER, ROLES.ADMIN)
  createInvoice(@Param('visitId') visitId: string) {
    return this.billingService.createInvoiceFromVisit(visitId);
  }

  // UC-16: Danh sách hóa đơn
  @Get('invoices')
  @Roles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN)
  findMany(@Query() query: QueryInvoicesDto) {
    return this.billingService.findMany(query);
  }

  // UC-16: Chi tiết hóa đơn
  @Get('invoices/:id')
  @Roles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN)
  findInvoice(@Param('id') id: string) {
    return this.billingService.findInvoice(id);
  }

  // UC-15
  @Post('invoices/:id/payments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLES.CASHIER, ROLES.ADMIN)
  createPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.billingService.createPayment(id, dto);
  }
}
