import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAppointmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ minimum: 15, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId?: string;
}
