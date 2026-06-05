import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ROLES } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDispenseDto, QueryDispenseDto } from './dto/create-dispense.dto';
import { PharmacyService } from './pharmacy.service';

@ApiTags('pharmacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Get('worklist')
  @Roles(ROLES.ADMIN, ROLES.PHARMACIST)
  @ApiOperation({ summary: 'Danh sách đơn thuốc cần phát (PENDING) theo ngày' })
  getWorklist(@Query('date') date?: string) {
    return this.pharmacyService.getWorklist(date);
  }

  @Post('dispense')
  @Roles(ROLES.ADMIN, ROLES.PHARMACIST)
  @ApiOperation({ summary: 'Phát thuốc theo đơn — trừ kho trong transaction' })
  dispense(@Body() dto: CreateDispenseDto, @Request() req: { user: { userId: string } }) {
    return this.pharmacyService.dispense(dto, req.user.userId);
  }

  @Get('dispense')
  @Roles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.MANAGER)
  @ApiOperation({ summary: 'Danh sách lần phát thuốc' })
  listDispenses(@Query() query: QueryDispenseDto) {
    return this.pharmacyService.listDispenses(query);
  }

  @Get('dispense/:id')
  @Roles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.DOCTOR, ROLES.MANAGER)
  @ApiOperation({ summary: 'Chi tiết lần phát thuốc' })
  findDispense(@Param('id') id: string) {
    return this.pharmacyService.findDispense(id);
  }

  @Patch('dispense/:id/cancel')
  @Roles(ROLES.ADMIN, ROLES.PHARMACIST)
  @ApiOperation({ summary: 'Hủy phát thuốc — hoàn trả kho' })
  cancelDispense(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.pharmacyService.cancelDispense(id, req.user.userId);
  }
}
