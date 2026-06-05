import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

// Note: Schema fields are title + specialty (not licenseNumber/consultationFee from spec)
export class CreateDoctorProfileDto {
  @IsString()
  userId: string;

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;
}

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
