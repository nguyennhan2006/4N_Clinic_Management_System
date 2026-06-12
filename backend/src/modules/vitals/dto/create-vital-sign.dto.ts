import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVitalSignDto {
  @ApiProperty()
  @IsString()
  visitId: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 300, description: 'Mạch (bpm)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  pulse?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 300,
    description: 'Huyết áp tâm thu (mmHg)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  systolicBp?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 200,
    description: 'Huyết áp tâm trương (mmHg)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  diastolicBp?: number;

  @ApiPropertyOptional({
    minimum: 30,
    maximum: 45,
    description: 'Nhiệt độ (°C)',
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, description: 'SpO2 (%)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  spo2?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 300,
    description: 'Chiều cao (cm)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 500,
    description: 'Cân nặng (kg)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  // BR-VS-02: ít nhất 1 field đo lường phải có giá trị (validated in service)
  @ValidateIf(() => false) // dummy to make decorator compile
  private _atLeastOneField?: never;
}
