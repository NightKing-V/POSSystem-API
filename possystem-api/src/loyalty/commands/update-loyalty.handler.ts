import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoyaltyCommand } from './update-loyalty.command';

@CommandHandler(UpdateLoyaltyCommand)
export class UpdateLoyaltyHandler implements ICommandHandler<UpdateLoyaltyCommand> {
  execute(command: UpdateLoyaltyCommand): Promise<string> {
    const { id } = command;
    return Promise.resolve(`This action updates a #${id} loyalty`);
  }
}
