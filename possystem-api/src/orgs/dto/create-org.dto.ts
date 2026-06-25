import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @IsNotEmpty()
  businesscategory_id!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
