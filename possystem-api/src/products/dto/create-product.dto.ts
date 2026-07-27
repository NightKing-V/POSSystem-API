import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  subcategoryid: string;

  @IsUUID()
  @IsOptional()
  brandid?: string;

  @IsUUID()
  @IsOptional()
  supplier_id?: string;

  @IsString()
  @IsOptional()
  SKU?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  initialPrice?: number;
}
