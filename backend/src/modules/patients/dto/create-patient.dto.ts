import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
