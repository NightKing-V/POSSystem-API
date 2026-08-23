import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePurchaseOrderCommand } from './create-purchase-order.command';

@CommandHandler(CreatePurchaseOrderCommand)
export class CreatePurchaseOrderHandler implements ICommandHandler<CreatePurchaseOrderCommand> {
  async execute(command: CreatePurchaseOrderCommand) {
    return 'This action adds a new purchaseOrder';
  }
}
