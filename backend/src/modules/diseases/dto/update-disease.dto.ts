import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDiseaseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
