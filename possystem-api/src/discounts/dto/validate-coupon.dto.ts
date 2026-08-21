import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CouponItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;
}

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CouponItemDto)
  items?: CouponItemDto[];
}
