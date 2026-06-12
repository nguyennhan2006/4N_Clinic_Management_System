import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ROLES } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRegulationDto } from './dto/create-regulation.dto';
import { RegulationsService } from './regulations.service';

@Controller('regulations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegulationsController {
  constructor(private readonly regulationsService: RegulationsService) {}

  @Get('current')
  @Roles(
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.DOCTOR,
    ROLES.CASHIER,
    ROLES.RECEPTIONIST,
  )
  getCurrent() {
    return this.regulationsService.getCurrent();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLES.ADMIN)
  create(@Body() dto: CreateRegulationDto) {
    return this.regulationsService.create(dto);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Roles(ROLES.ADMIN)
  activate(@Param('id') id: string) {
    return this.regulationsService.activate(id);
  }
}
