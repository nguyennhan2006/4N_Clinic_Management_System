import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { ROLES } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateRoomDto, UpdateRoomDto } from './dto/create-room.dto';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './dto/create-doctor-profile.dto';
import {
  CreateStaffScheduleDto,
  QueryScheduleDto,
} from './dto/create-staff-schedule.dto';
import { OrganizationService } from './organization.service';

class QueryDepartmentsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  activeOnly?: boolean;
}

class QueryRoomsDto {
  @IsOptional()
  departmentId?: string;
}

@ApiTags('organization')
@ApiBearerAuth()
@Controller('organization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // ─── Departments ─────────────────────────────────────────────────────────

  @Get('departments')
  @Roles(
    ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR,
    ROLES.RECEPTIONIST, ROLES.NURSE, ROLES.CASHIER,
    ROLES.LAB_TECHNICIAN, ROLES.PHARMACIST,
  )
  findDepartments(@Query() query: QueryDepartmentsDto) {
    return this.organizationService.findDepartments(
      query.activeOnly !== undefined ? query.activeOnly : undefined,
    );
  }

  @Post('departments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLES.ADMIN)
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationService.createDepartment(dto);
  }

  @Patch('departments/:id')
  @Roles(ROLES.ADMIN)
  updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.organizationService.updateDepartment(id, dto);
  }

  // ─── Rooms ────────────────────────────────────────────────────────────────

  @Get('rooms')
  @Roles(
    ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR,
    ROLES.RECEPTIONIST, ROLES.NURSE,
  )
  findRooms(@Query() query: QueryRoomsDto) {
    return this.organizationService.findRooms(query.departmentId);
  }

  @Post('rooms')
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLES.ADMIN)
  createRoom(@Body() dto: CreateRoomDto) {
    return this.organizationService.createRoom(dto);
  }

  @Patch('rooms/:id')
  @Roles(ROLES.ADMIN)
  updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.organizationService.updateRoom(id, dto);
  }

  // ─── DoctorProfiles ───────────────────────────────────────────────────────

  @Get('doctors')
  @Roles(
    ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR,
    ROLES.RECEPTIONIST, ROLES.NURSE, ROLES.LAB_TECHNICIAN,
  )
  findDoctors() {
    return this.organizationService.findDoctors();
  }

  @Post('doctors')
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLES.ADMIN)
  createDoctorProfile(@Body() dto: CreateDoctorProfileDto) {
    return this.organizationService.createDoctorProfile(dto);
  }

  @Patch('doctors/:id')
  @Roles(ROLES.ADMIN)
  updateDoctorProfile(
    @Param('id') id: string,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    return this.organizationService.updateDoctorProfile(id, dto);
  }

  // ─── StaffSchedules ───────────────────────────────────────────────────────

  @Get('schedules')
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.NURSE, ROLES.DOCTOR)
  findSchedules(@Query() query: QueryScheduleDto) {
    return this.organizationService.findSchedules(query);
  }

  @Post('schedules')
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLES.ADMIN)
  createSchedule(@Body() dto: CreateStaffScheduleDto) {
    return this.organizationService.createSchedule(dto);
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(ROLES.ADMIN)
  deleteSchedule(@Param('id') id: string) {
    return this.organizationService.deleteSchedule(id);
  }
}
