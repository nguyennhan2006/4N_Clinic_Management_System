import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PrescriptionItemInputDto {
  @IsString()
  drugId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  dosage: string;
}

export class CreatePrescriptionDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemInputDto)
  items: PrescriptionItemInputDto[];
}
