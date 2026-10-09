import { ICommand } from '@nestjs/cqrs';

export class DeleteSystemRoleCommand implements ICommand {
  constructor(public readonly id: string) {}
}
