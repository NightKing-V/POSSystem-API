import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSystemRoleDto {
  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_org_template?: boolean;

  @IsBoolean()
  @IsOptional()
  is_org_entrypoint?: boolean;

  @IsBoolean()
  @IsOptional()
  is_location_scoped?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}

