import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateVisitDto {
  @IsString()
  patientId: string;

  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
