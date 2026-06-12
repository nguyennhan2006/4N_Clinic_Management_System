import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QueueStatus } from '@prisma/client';

export class UpdateQueueStatusDto {
  @ApiProperty({ enum: QueueStatus })
  @IsEnum(QueueStatus)
  status: QueueStatus;
}
