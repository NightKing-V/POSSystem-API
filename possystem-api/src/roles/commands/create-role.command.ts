import { ICommand } from '@nestjs/cqrs';
import { CreateRoleDto } from '../dto/create-role.dto';

export class CreateRoleCommand implements ICommand {
  constructor(public readonly createRoleDto: CreateRoleDto) {}
}
