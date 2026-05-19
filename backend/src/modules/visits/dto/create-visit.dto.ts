import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVisitDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  // Không truyền → lấy ngày hôm nay (xử lý tại service qua toDateOnly)
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason?: string;
}
