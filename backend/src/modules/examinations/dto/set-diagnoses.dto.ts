import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';

class DiagnosisInputDto {
  @IsString()
  name: string;

  @IsBoolean()
  isPrimary: boolean;
}

export class SetDiagnosesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisInputDto)
  diagnoses: DiagnosisInputDto[];
}
