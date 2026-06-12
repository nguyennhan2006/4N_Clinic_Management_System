import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ROLES } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CheckinDto } from './dto/checkin.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Roles(
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.DOCTOR,
    ROLES.NURSE,
    ROLES.MANAGER,
    ROLES.CASHIER,
  )
  @ApiOperation({ summary: 'Danh sách lịch hẹn' })
  findAll(@Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.findAll(query);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTIONIST)
  @ApiOperation({ summary: 'Đặt lịch hẹn mới' })
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.appointmentsService.create(dto, user.sub);
  }

  @Get(':id')
  @Roles(
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.DOCTOR,
    ROLES.NURSE,
    ROLES.MANAGER,
    ROLES.CASHIER,
  )
  @ApiOperation({ summary: 'Chi tiết lịch hẹn' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTIONIST)
  @ApiOperation({ summary: 'Cập nhật lịch hẹn (chỉ SCHEDULED)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.appointmentsService.update(id, dto, user.sub);
  }

  @Patch(':id/cancel')
  @Roles(ROLES.ADMIN, ROLES.RECEPTIONIST)
  @ApiOperation({ summary: 'Hủy lịch hẹn' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.appointmentsService.cancel(id, user.sub);
  }

  @Post(':id/checkin')
  @Roles(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.NURSE)
  @ApiOperation({ summary: 'Check-in bệnh nhân → tạo Visit + QueueTicket' })
  checkin(
    @Param('id') id: string,
    @Body() dto: CheckinDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.appointmentsService.checkin(id, dto, user.sub);
  }
}
