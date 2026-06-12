import { BadRequestException } from '@nestjs/common';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Parse "YYYY-MM-DD" thành Date ở 00:00:00 UTC (khớp Visit.visitDate @db.Date).
// Không truyền value => lấy ngày hôm nay.
export function toDateOnly(value?: string): Date {
  if (value !== undefined && !DATE_ONLY_REGEX.test(value)) {
    throw new BadRequestException('Invalid date format, expected YYYY-MM-DD');
  }

  const source = value ?? new Date().toISOString().slice(0, 10);
  const parsed = new Date(`${source}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Invalid date value');
  }

  return parsed;
}
