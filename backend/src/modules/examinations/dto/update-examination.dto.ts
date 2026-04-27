import { IsOptional, IsString } from 'class-validator';

export class UpdateExaminationDto {
  @IsOptional()
  @IsString()
  symptoms?: string;

  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @IsOptional()
  @IsString()
  conclusion?: string;
}
