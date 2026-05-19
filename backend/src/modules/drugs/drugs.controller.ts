import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { ROLES } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DrugsService } from './drugs.service';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';

class QueryDrugsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  activeOnly?: boolean;
}

@Controller('drugs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DrugsController {
  constructor(private readonly drugsService: DrugsService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR)
  findAll(@Query() query: QueryDrugsDto) {
    return this.drugsService.findAll(query.activeOnly);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLES.ADMIN)
  create(@Body() dto: CreateDrugDto) {
    return this.drugsService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(ROLES.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateDrugDto) {
    return this.drugsService.update(id, dto);
  }
}
