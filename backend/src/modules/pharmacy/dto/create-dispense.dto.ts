import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DispenseStatus } from '@prisma/client';

export class DispenseItemDto {
  @ApiProperty({ description: 'PrescriptionItem.id' })
  @IsString()
  prescriptionItemId: string;

  @ApiProperty({ description: 'StockLot.id — lấy từ lô nào' })
  @IsString()
  stockLotId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateDispenseDto {
  @ApiProperty({ description: 'Prescription.id' })
  @IsString()
  prescriptionId: string;

  @ApiProperty({ description: 'Visit.id gắn với đơn thuốc' })
  @IsString()
  visitId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [DispenseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items: DispenseItemDto[];
}

export class QueryDispenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prescriptionId?: string;

  @ApiPropertyOptional({ enum: DispenseStatus })
  @IsOptional()
  @IsEnum(DispenseStatus)
  status?: DispenseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;
}
