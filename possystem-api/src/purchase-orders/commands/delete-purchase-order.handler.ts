import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeletePurchaseOrderCommand } from './delete-purchase-order.command';

@CommandHandler(DeletePurchaseOrderCommand)
export class DeletePurchaseOrderHandler implements ICommandHandler<DeletePurchaseOrderCommand> {
  async execute(command: DeletePurchaseOrderCommand) {
    const { id } = command;
    return `This action removes a #${id} purchaseOrder`;
  }
}
