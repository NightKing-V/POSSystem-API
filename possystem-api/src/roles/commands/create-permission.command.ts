import { ICommand } from '@nestjs/cqrs';
import { CreatePermissionDto } from '../dto/create-permission.dto';

export class CreatePermissionCommand implements ICommand {
  constructor(public readonly createPermissionDto: CreatePermissionDto) {}
}
