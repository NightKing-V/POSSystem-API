import { ICommand } from '@nestjs/cqrs';

export class DeleteUserWorkflowCommand implements ICommand {
  constructor(public readonly userId: string) {}
}
