import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ModifyRolePermissionsDto {
  @ApiProperty({
    description: 'Array of Permission UUIDs to attach to the role',
    example: ['b3d9c1a0-1234-4567-89ab-cdef01234567'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionIds!: string[];
}
