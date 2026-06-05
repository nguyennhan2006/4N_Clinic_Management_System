import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { ROLES } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';
import { ExaminationsService } from './examinations.service';

@Controller('examinations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Get(':id')
  @Roles(ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN)
  findOne(@Param('id') id: string) {
    return this.examinationsService.findOne(id);
  }

  // UC-10
  @Patch(':id')
  @Roles(ROLES.DOCTOR, ROLES.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateExaminationDto) {
    return this.examinationsService.update(id, dto);
  }

  @Post(':id/prescription')
  @Roles(ROLES.DOCTOR, ROLES.ADMIN)
  createPrescription(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.examinationsService.createPrescription(id, dto);
  }

  // UC-12: Replace-all prescription
  @Put(':id/prescription')
  @Roles(ROLES.DOCTOR, ROLES.ADMIN)
  upsertPrescription(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.examinationsService.upsertPrescription(id, dto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(ROLES.DOCTOR, ROLES.ADMIN)
  complete(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.examinationsService.complete(id, user.sub);
  }
}
