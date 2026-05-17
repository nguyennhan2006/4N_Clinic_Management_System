import { VisitStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryVisitsDto {
  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD — không truyền => hôm nay

  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;
}
