import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ROLES } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { VitalsService } from './vitals.service';

@ApiTags('vitals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vitals')
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @Roles(ROLES.ADMIN, ROLES.NURSE, ROLES.DOCTOR)
  @ApiOperation({ summary: 'Ghi/cập nhật chỉ số sinh tồn cho visit' })
  create(
    @Body() dto: CreateVitalSignDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.vitalsService.create(dto, user.sub);
  }

  @Get('visit/:visitId')
  @Roles(
    ROLES.ADMIN,
    ROLES.NURSE,
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
    ROLES.MANAGER,
  )
  @ApiOperation({ summary: 'Lấy vital signs của visit' })
  getByVisit(@Param('visitId') visitId: string) {
    return this.vitalsService.getByVisit(visitId);
  }
}
