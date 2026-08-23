import { ICommand } from '@nestjs/cqrs';

export class DeleteProductPriceCommand implements ICommand {
  constructor(public readonly priceId: string) {}
}
