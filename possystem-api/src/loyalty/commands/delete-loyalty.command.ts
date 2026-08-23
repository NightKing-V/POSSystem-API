import { ICommand } from '@nestjs/cqrs';

export class DeleteLoyaltyCommand implements ICommand {
  constructor(public readonly id: number) {}
}
