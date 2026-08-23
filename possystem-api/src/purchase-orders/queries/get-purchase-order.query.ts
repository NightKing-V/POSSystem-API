import { IQuery } from '@nestjs/cqrs';

export class GetPurchaseOrderQuery implements IQuery {
  constructor(public readonly id: number) {}
}
