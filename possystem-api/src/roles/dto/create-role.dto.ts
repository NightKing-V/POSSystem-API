import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRoleDto {
  @IsUUID()
  @IsNotEmpty()
  org_id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_location_scoped?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}
