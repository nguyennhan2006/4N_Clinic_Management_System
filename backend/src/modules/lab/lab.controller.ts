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
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { QueryLabOrdersDto } from './dto/query-lab-orders.dto';
import { UpdateLabSampleDto } from './dto/update-lab-sample.dto';
import { LabService } from './lab.service';

@ApiTags('lab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Post('orders')
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  @ApiOperation({ summary: 'Tạo lab order từ service order type=LAB_TEST' })
  createOrder(@Body() dto: CreateLabOrderDto, @Request() req: { user: { userId: string } }) {
    return this.labService.createOrder(dto, req.user.userId);
  }

  @Get('orders')
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB_TECHNICIAN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Danh sách lab orders (worklist)' })
  listOrders(@Query() query: QueryLabOrdersDto) {
    return this.labService.listOrders(query);
  }

  @Get('orders/:id')
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB_TECHNICIAN, ROLES.NURSE, ROLES.MANAGER)
  @ApiOperation({ summary: 'Chi tiết lab order' })
  findOrder(@Param('id') id: string) {
    return this.labService.findOrder(id);
  }

  @Post('orders/:id/sample')
  @Roles(ROLES.ADMIN, ROLES.LAB_TECHNICIAN, ROLES.NURSE)
  @ApiOperation({ summary: 'Ghi nhận mẫu đã lấy (ORDERED → SAMPLE_COLLECTED)' })
  collectSample(
    @Param('id') id: string,
    @Body() dto: UpdateLabSampleDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.labService.collectSample(id, dto, req.user.userId);
  }

  @Post('orders/:id/result')
  @Roles(ROLES.ADMIN, ROLES.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Nhập kết quả xét nghiệm (SAMPLE_COLLECTED → RESULT_ENTERED)' })
  submitResult(
    @Param('id') id: string,
    @Body() dto: CreateLabResultDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.labService.submitResult(id, dto, req.user.userId);
  }

  @Post('orders/:id/verify')
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  @ApiOperation({ summary: 'Xác nhận kết quả (RESULT_ENTERED → VERIFIED)' })
  verifyResult(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.labService.verifyResult(id, req.user.userId);
  }

  @Get('orders/:id/result')
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB_TECHNICIAN, ROLES.NURSE, ROLES.MANAGER)
  @ApiOperation({ summary: 'Lấy kết quả xét nghiệm của lab order' })
  getResult(@Param('id') id: string) {
    return this.labService.getResult(id);
  }
}
