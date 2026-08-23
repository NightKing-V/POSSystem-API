import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoyaltyCommand } from './update-loyalty.command';

@CommandHandler(UpdateLoyaltyCommand)
export class UpdateLoyaltyHandler implements ICommandHandler<UpdateLoyaltyCommand> {
  async execute(command: UpdateLoyaltyCommand) {
    const { id } = command;
    return `This action updates a #${id} loyalty`;
  }
}
