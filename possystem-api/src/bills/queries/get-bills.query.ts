import { IQuery } from '@nestjs/cqrs';

export class GetBillsQuery implements IQuery {
  constructor(
    public readonly orgId?: string,
    public readonly locationId?: string,
    public readonly customerId?: string,
  ) {}
}
