import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoyaltyCommand } from './create-loyalty.command';

@CommandHandler(CreateLoyaltyCommand)
export class CreateLoyaltyHandler implements ICommandHandler<CreateLoyaltyCommand> {
  async execute(command: CreateLoyaltyCommand) {
    return 'This action adds a new loyalty';
  }
}
