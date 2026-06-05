import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const ROOM_TYPES = ['CONSULTATION', 'LAB', 'PHARMACY', 'PROCEDURE'] as const;

export class CreateRoomDto {
  @IsString()
  departmentId: string;

  @IsString()
  @MaxLength(20)
  code: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsIn(ROOM_TYPES)
  roomType: string;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
