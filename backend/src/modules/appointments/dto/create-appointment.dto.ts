import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'DoctorProfile.id (không phải userId)' })
  @IsString()
  doctorProfileId: string;

  @ApiProperty({ description: 'ISO datetime YYYY-MM-DDTHH:mm:ss' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ description: 'departmentId của cuộc hẹn' })
  @IsString()
  departmentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduleId?: string;

  @ApiPropertyOptional({ minimum: 15, maximum: 120, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
