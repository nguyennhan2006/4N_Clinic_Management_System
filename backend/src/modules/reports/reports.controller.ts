import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';

import { ROLES } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReportsService } from './reports.service';

class QueryMonthlyDto {
  @IsString()
  @IsNotEmpty()
  month: string;
}

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  getMonthlySummary(@Query() query: QueryMonthlyDto) {
    return this.reportsService.getMonthlySummary(query.month);
  }

  @Get('revenue-breakdown')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  getRevenueBreakdown(@Query() query: QueryMonthlyDto) {
    return this.reportsService.getRevenueBreakdown(query.month);
  }
}
