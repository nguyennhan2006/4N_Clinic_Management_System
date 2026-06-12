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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateVisitDto } from './dto/create-visit.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';
import { VisitsService } from './visits.service';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @Roles(ROLES.RECEPTIONIST, ROLES.ADMIN)
  create(@Body() dto: CreateVisitDto, @CurrentUser() user: { sub: string }) {
    return this.visitsService.create(dto, user.sub);
  }

  @Get()
  @Roles(ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN)
  findAll(@Query() query: QueryVisitsDto) {
    return this.visitsService.findAll(query);
  }

  @Post(':id/open-examination')
  @Roles(ROLES.DOCTOR, ROLES.ADMIN)
  openExamination(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.visitsService.openExamination(id, user.sub);
  }
}
