import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LabOrderStatus } from '@prisma/client';

export class QueryLabOrdersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitId?: string;

  @ApiPropertyOptional({ enum: LabOrderStatus })
  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;
}
