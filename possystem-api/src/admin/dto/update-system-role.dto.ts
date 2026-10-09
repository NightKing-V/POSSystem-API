import { PartialType } from '@nestjs/mapped-types';
import { CreateSystemRoleDto } from './create-system-role.dto';

export class UpdateSystemRoleDto extends PartialType(CreateSystemRoleDto) {}
