import { IQuery } from '@nestjs/cqrs';

export class GetSupplierProductsQuery implements IQuery {
  constructor(public readonly id: string) {}
}
