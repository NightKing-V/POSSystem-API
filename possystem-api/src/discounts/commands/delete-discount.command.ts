import { ICommand } from '@nestjs/cqrs';

export class DeleteDiscountCommand implements ICommand {
  constructor(public readonly id: string) {}
}
