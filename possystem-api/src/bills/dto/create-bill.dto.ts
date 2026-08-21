import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class BillTaxDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class BillItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsOptional()
  batch_id?: string;

  @IsUUID()
  @IsOptional()
  price_id?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BillPaymentDto {
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  reference_no?: string;
}

export class CreateBillDto {
  @IsUUID()
  @IsNotEmpty()
  org_id: string;

  @IsUUID()
  @IsNotEmpty()
  location_id: string;

  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @IsUUID()
  @IsNotEmpty()
  cashier_id: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  coupon_code?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BillTaxDto)
  taxes?: BillTaxDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillPaymentDto)
  payments: BillPaymentDto[];
}

