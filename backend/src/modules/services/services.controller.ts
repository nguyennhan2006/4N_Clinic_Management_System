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
import {
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
} from './dto/create-service-catalog.dto';
import {
  CreateServiceOrderDto,
  QueryServiceOrdersDto,
  UpdateServiceOrderStatusDto,
} from './dto/create-service-order.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ─── Service Catalog ──────────────────────────────────────────────────────

  @Get('service-catalog')
  @Roles(
    ROLES.ADMIN,
    ROLES.DOCTOR,
    ROLES.MANAGER,
    ROLES.NURSE,
    ROLES.LAB_TECHNICIAN,
    ROLES.RECEPTIONIST,
  )
  @ApiOperation({ summary: 'Danh sách catalog dịch vụ' })
  listCatalog(@Query('type') type?: string) {
    return this.servicesService.listCatalog(type);
  }

  @Post('service-catalog')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Thêm dịch vụ vào catalog' })
  createCatalog(@Body() dto: CreateServiceCatalogDto) {
    return this.servicesService.createCatalog(dto);
  }

  @Patch('service-catalog/:id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Cập nhật dịch vụ trong catalog' })
  updateCatalog(@Param('id') id: string, @Body() dto: UpdateServiceCatalogDto) {
    return this.servicesService.updateCatalog(id, dto);
  }

  // ─── Service Orders ───────────────────────────────────────────────────────

  @Get('service-orders')
  @Roles(
    ROLES.ADMIN,
    ROLES.DOCTOR,
    ROLES.NURSE,
    ROLES.LAB_TECHNICIAN,
    ROLES.MANAGER,
    ROLES.CASHIER,
  )
  @ApiOperation({ summary: 'Danh sách service orders' })
  listOrders(@Query() query: QueryServiceOrdersDto) {
    return this.servicesService.listOrders(query);
  }

  @Get('service-orders/:id')
  @Roles(
    ROLES.ADMIN,
    ROLES.DOCTOR,
    ROLES.NURSE,
    ROLES.LAB_TECHNICIAN,
    ROLES.MANAGER,
    ROLES.CASHIER,
  )
  @ApiOperation({ summary: 'Chi tiết service order' })
  findOrder(@Param('id') id: string) {
    return this.servicesService.findOrder(id);
  }

  @Post('service-orders')
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  @ApiOperation({ summary: 'Chỉ định dịch vụ cho visit' })
  createOrder(
    @Body() dto: CreateServiceOrderDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.servicesService.createOrder(dto, user.sub);
  }

  @Patch('service-orders/:id/status')
  @Roles(ROLES.ADMIN, ROLES.NURSE, ROLES.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Cập nhật trạng thái service order' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateServiceOrderStatusDto,
  ) {
    return this.servicesService.updateOrderStatus(id, dto.status);
  }
}
