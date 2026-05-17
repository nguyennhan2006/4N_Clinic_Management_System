import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DiagnosisInputDto {
  @IsString()
  diseaseId: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

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

  // Nếu có (kể cả mảng rỗng) => thay thế toàn bộ diagnosis cũ.
  // Không truyền => giữ nguyên diagnosis hiện tại.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisInputDto)
  diagnoses?: DiagnosisInputDto[];
}
