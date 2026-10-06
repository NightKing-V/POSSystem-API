import { ICommand } from '@nestjs/cqrs';
import { UpdateSystemRoleDto } from '../dto/update-system-role.dto';

export class UpdateSystemRoleCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateSystemRoleDto: UpdateSystemRoleDto,
  ) {}
}
