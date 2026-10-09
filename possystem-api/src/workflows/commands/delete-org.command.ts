import { ICommand } from '@nestjs/cqrs';

export class DeleteOrgCommand implements ICommand {
  constructor(public readonly id: string) {}
}

export { DeleteOrgCommand as DeleteOrgWorkflowCommand };
