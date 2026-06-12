import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLabOrderDto {
  @ApiProperty({ description: 'ServiceOrder.id — phải có type=LAB_TEST' })
  @IsString()
  serviceOrderId: string;

  @ApiProperty({ description: 'LabTestCatalog.id' })
  @IsString()
  labTestId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicalInfo?: string;
}
