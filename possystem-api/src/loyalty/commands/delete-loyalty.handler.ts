import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoyaltyCommand } from './delete-loyalty.command';

@CommandHandler(DeleteLoyaltyCommand)
export class DeleteLoyaltyHandler implements ICommandHandler<DeleteLoyaltyCommand> {
  execute(command: DeleteLoyaltyCommand): Promise<string> {
    const { id } = command;
    return Promise.resolve(`This action removes a #${id} loyalty`);
  }
}
