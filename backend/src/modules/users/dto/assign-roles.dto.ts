import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách role ID sẽ gán cho user (thay thế toàn bộ)',
  })
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}
