import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckinDto {
  @ApiPropertyOptional({ description: 'Override room nếu cần' })
  @IsOptional()
  @IsString()
  roomId?: string;
}
