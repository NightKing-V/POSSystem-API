import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateDiscountDto {
  @IsUUID()
  @IsNotEmpty()
  org_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['PERCENTAGE', 'FIXED'])
  type: string;

  @IsNumber()
  @Min(0)
  value: number;

  @IsDateString()
  @IsOptional()
  valid_from?: string;

  @IsDateString()
  @IsOptional()
  valid_to?: string;

  @IsNumber()
  @IsOptional()
  min_qty?: number;

  @IsNumber()
  @IsOptional()
  min_val?: number;

  @IsString()
  @IsOptional()
  coup_code?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_stackable?: boolean;

  @IsEnum(['PRODUCT', 'CATEGORY', 'ORDER'])
  scope: string;

  @IsUUID(undefined, { each: true })
  @IsOptional()
  product_ids?: string[];

  @IsUUID(undefined, { each: true })
  @IsOptional()
  category_ids?: string[];
}
