import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ROLES } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @Roles(ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN)
  findAll(@Query('keyword') keyword?: string) {
    return this.patientsService.findAll(keyword);
  }

  @Post()
  @Roles(ROLES.RECEPTIONIST, ROLES.ADMIN)
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  // UC-11 — khai báo trước ':id' để route khớp đúng
  @Get(':id/medical-history')
  @Roles(ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN)
  getMedicalHistory(@Param('id') id: string) {
    return this.patientsService.getMedicalHistory(id);
  }

  @Get(':id')
  @Roles(ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN)
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }
}
