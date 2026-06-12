import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLabResultDto {
  @ApiPropertyOptional({ description: 'Mô tả kết quả dạng text' })
  @IsOptional()
  @IsString()
  resultText?: string;

  @ApiPropertyOptional({ description: 'Giá trị số nếu có' })
  @IsOptional()
  @IsNumber()
  resultValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Giá trị tham chiếu cho kết quả này' })
  @IsOptional()
  @IsString()
  referenceRange?: string;
}
