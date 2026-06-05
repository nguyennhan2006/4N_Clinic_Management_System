import { Body, Controller, Get, Param, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ROLES } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QueryQueueDto } from './dto/query-queue.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import { QueueService } from './queue.service';

@ApiTags('queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.MANAGER)
  @ApiOperation({ summary: 'Danh sách hàng đợi theo ngày/department' })
  findAll(@Query() query: QueryQueueDto) {
    return this.queueService.findAll(query);
  }

  @Get('next')
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  @ApiOperation({ summary: 'Ticket tiếp theo đang WAITING' })
  getNext(@Query('departmentId') departmentId?: string) {
    return this.queueService.getNext(departmentId);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.MANAGER)
  @ApiOperation({ summary: 'Chi tiết queue ticket' })
  findOne(@Param('id') id: string) {
    return this.queueService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  @ApiOperation({ summary: 'Cập nhật trạng thái ticket (state machine)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQueueStatusDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.queueService.updateStatus(id, dto.status, req.user.userId);
  }
}
