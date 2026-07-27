import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductPriceDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  @IsOptional()
  effectivefrom?: string;

  @IsDateString()
  @IsOptional()
  effectiveto?: string;

  @IsBoolean()
  @IsOptional()
  isdefault?: boolean;
}
