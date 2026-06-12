import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockLotDto {
  @ApiProperty()
  @IsString()
  drugId: string;

  @ApiProperty({ description: 'Số lượng nhập', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Giá nhập (VND)', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiProperty({ description: 'Số lô — unique per drugId' })
  @IsString()
  lotNumber: string;

  @ApiPropertyOptional({ description: 'Hạn dùng YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Tên nhà cung cấp' })
  @IsOptional()
  @IsString()
  supplierName?: string;
}

export class QueryStockDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  drugId?: string;

  @ApiPropertyOptional({ description: 'Chỉ lô sắp hết (quantityOnHand < 10)' })
  @IsOptional()
  lowStock?: string;

  @ApiPropertyOptional({ description: 'Chỉ lô gần hết hạn (< 30 ngày)' })
  @IsOptional()
  expiringSoon?: string;
}
