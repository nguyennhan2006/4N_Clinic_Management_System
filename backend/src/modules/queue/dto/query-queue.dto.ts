import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueueStatus } from '@prisma/client';

export class QueryQueueDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD, default: hôm nay' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: QueueStatus })
  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;
}
