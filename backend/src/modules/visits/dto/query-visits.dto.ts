import { VisitStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryVisitsDto {
  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD — không truyền => hôm nay

  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | undefined;
  })
  @IsBoolean()
  hasInvoice?: boolean; // true = có invoice, false = chưa có invoice
}
