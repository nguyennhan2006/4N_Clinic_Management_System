import { IsDateString, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

// CF-005: Schema uses startTime/endTime as String (should be DateTime per baseline).
// Using String + regex validation until schema correction migration is run.

export class CreateStaffScheduleDto {
  @IsString()
  userId: string;

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsDateString()
  workDate: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:MM format' })
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be HH:MM format' })
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(60)
  slotDurationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxAppointments?: number;
}

export class QueryScheduleDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
