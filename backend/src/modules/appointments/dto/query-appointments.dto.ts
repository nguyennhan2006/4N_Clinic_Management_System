import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class QueryAppointmentsDto {
  @ApiPropertyOptional({ description: 'Filter theo ngày YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  doctorProfileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}
