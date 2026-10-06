import { ICommand } from '@nestjs/cqrs';

export class RemoveSystemRoleCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
  ) {}
}
