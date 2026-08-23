import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoyaltyCommand } from './delete-loyalty.command';

@CommandHandler(DeleteLoyaltyCommand)
export class DeleteLoyaltyHandler implements ICommandHandler<DeleteLoyaltyCommand> {
  async execute(command: DeleteLoyaltyCommand) {
    const { id } = command;
    return `This action removes a #${id} loyalty`;
  }
}
