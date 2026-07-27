import { IsOptional, IsString } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @IsOptional()
  businesscategory_id?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
