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
import { DiseasesService } from './diseases.service';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { UpdateDiseaseDto } from './dto/update-disease.dto';

class QueryDiseasesDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  activeOnly?: boolean;
}

@Controller('diseases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiseasesController {
  constructor(private readonly diseasesService: DiseasesService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.RECEPTIONIST)
  findAll(@Query() query: QueryDiseasesDto) {
    return this.diseasesService.findAll(query.activeOnly);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLES.ADMIN)
  create(@Body() dto: CreateDiseaseDto) {
    return this.diseasesService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(ROLES.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateDiseaseDto) {
    return this.diseasesService.update(id, dto);
  }
}
