import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

const ALLOWED_KEYS = ['MAX_PATIENTS_PER_DAY', 'CONSULTATION_FEE'] as const;

class RegulationItemDto {
  @IsString()
  @IsIn(ALLOWED_KEYS)
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateRegulationDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegulationItemDto)
  items: RegulationItemDto[];
}
