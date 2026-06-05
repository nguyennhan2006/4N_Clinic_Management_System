import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreateStockLotDto, QueryStockDto } from './dto/create-stock-lot.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.PHARMACIST)
  @ApiOperation({ summary: 'Tổng hợp tồn kho theo drug' })
  getStockSummary(@Query() query: QueryStockDto) {
    return this.inventoryService.getStockSummary(query);
  }

  @Get('lots')
  @Roles(ROLES.ADMIN, ROLES.PHARMACIST)
  @ApiOperation({ summary: 'Danh sách stock lots' })
  listLots(@Query('drugId') drugId?: string) {
    return this.inventoryService.listLots(drugId);
  }

  @Post('lots')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Nhập lô thuốc mới vào kho' })
  createLot(
    @Body() dto: CreateStockLotDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.inventoryService.createLot(dto, req.user.userId);
  }

  @Get('lots/:id')
  @Roles(ROLES.ADMIN, ROLES.PHARMACIST)
  @ApiOperation({ summary: 'Chi tiết stock lot' })
  findLot(@Param('id') id: string) {
    return this.inventoryService.findLot(id);
  }

  @Get('movements')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Lịch sử biến động kho' })
  listMovements(@Query('drugId') drugId?: string) {
    return this.inventoryService.listMovements(drugId);
  }

  @Get('drugs/:drugId/stock')
  @Roles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.DOCTOR, ROLES.NURSE)
  @ApiOperation({ summary: 'Tồn kho của 1 thuốc (dùng trong prescription UI)' })
  getDrugStock(@Param('drugId') drugId: string) {
    return this.inventoryService.getDrugStock(drugId);
  }
}
