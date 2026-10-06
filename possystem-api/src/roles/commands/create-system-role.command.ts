import { ICommand } from '@nestjs/cqrs';
import { CreateSystemRoleDto } from '../dto/create-system-role.dto';

export class CreateSystemRoleCommand implements ICommand {
  constructor(public readonly createSystemRoleDto: CreateSystemRoleDto) {}
}
