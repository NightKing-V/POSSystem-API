import { IQuery } from '@nestjs/cqrs';

export class GetProductPricesQuery implements IQuery {
  constructor(public readonly productId: string) {}
}
