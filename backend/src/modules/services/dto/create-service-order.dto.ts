import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatus, ServiceType } from '@prisma/client';

export class CreateServiceOrderDto {
  @ApiProperty()
  @IsString()
  visitId: string;

  @ApiPropertyOptional({ description: 'Gắn với examination nếu bác sĩ chỉ định' })
  @IsOptional()
  @IsString()
  examinationId?: string;

  @ApiProperty({ description: 'ServiceCatalog.id' })
  @IsString()
  serviceId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class QueryServiceOrdersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examinationId?: string;

  @ApiPropertyOptional({ enum: ServiceOrderStatus })
  @IsOptional()
  @IsEnum(ServiceOrderStatus)
  status?: ServiceOrderStatus;

  @ApiPropertyOptional({ enum: ServiceType })
  @IsOptional()
  @IsEnum(ServiceType)
  type?: ServiceType;
}

export class UpdateServiceOrderStatusDto {
  @ApiProperty({ enum: ServiceOrderStatus })
  @IsEnum(ServiceOrderStatus)
  status: ServiceOrderStatus;
}
