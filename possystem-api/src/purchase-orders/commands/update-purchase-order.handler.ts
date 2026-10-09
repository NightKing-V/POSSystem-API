import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePurchaseOrderCommand } from './update-purchase-order.command';

@CommandHandler(UpdatePurchaseOrderCommand)
export class UpdatePurchaseOrderHandler implements ICommandHandler<UpdatePurchaseOrderCommand> {
  execute(command: UpdatePurchaseOrderCommand): Promise<string> {
    const { id } = command;
    return Promise.resolve(`This action updates a #${id} purchaseOrder`);
  }
}
