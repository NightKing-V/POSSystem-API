import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}

