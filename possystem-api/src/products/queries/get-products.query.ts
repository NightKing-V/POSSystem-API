import { IQuery } from '@nestjs/cqrs';

export class GetProductsQuery implements IQuery {
  constructor(public readonly orgId?: string) {}
}
