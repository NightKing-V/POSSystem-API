import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeletePurchaseOrderCommand } from './delete-purchase-order.command';

@CommandHandler(DeletePurchaseOrderCommand)
export class DeletePurchaseOrderHandler implements ICommandHandler<DeletePurchaseOrderCommand> {
  execute(command: DeletePurchaseOrderCommand): Promise<string> {
    const { id } = command;
    return Promise.resolve(`This action removes a #${id} purchaseOrder`);
  }
}
