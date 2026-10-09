import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoyaltyCommand } from './create-loyalty.command';

@CommandHandler(CreateLoyaltyCommand)
export class CreateLoyaltyHandler implements ICommandHandler<CreateLoyaltyCommand> {
  execute(): Promise<string> {
    return Promise.resolve('This action adds a new loyalty');
  }
}
