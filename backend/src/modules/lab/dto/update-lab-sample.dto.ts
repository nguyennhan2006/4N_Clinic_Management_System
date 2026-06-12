import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLabSampleDto {
  @ApiPropertyOptional({ description: 'blood | urine | swab | stool | tissue' })
  @IsOptional()
  @IsString()
  sampleType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  collectedAt?: string;
}
