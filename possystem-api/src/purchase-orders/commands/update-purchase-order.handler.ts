import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePurchaseOrderCommand } from './update-purchase-order.command';

@CommandHandler(UpdatePurchaseOrderCommand)
export class UpdatePurchaseOrderHandler implements ICommandHandler<UpdatePurchaseOrderCommand> {
  async execute(command: UpdatePurchaseOrderCommand) {
    const { id } = command;
    return `This action updates a #${id} purchaseOrder`;
  }
}
