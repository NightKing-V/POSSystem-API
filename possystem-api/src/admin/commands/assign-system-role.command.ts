import { ICommand } from '@nestjs/cqrs';

export class AssignSystemRoleCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly assignerId: string,
  ) {}
}
