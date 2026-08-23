import { ICommand } from '@nestjs/cqrs';

export class DeletePurchaseOrderCommand implements ICommand {
  constructor(public readonly id: number) {}
}
