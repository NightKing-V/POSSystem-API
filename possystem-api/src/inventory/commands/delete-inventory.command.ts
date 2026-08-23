import { ICommand } from '@nestjs/cqrs';

export class DeleteInventoryCommand implements ICommand {
  constructor(public readonly id: string) {}
}
