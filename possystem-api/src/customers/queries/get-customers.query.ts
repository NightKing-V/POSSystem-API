import { IQuery } from '@nestjs/cqrs';

export class GetCustomersQuery implements IQuery {
  constructor(public readonly orgId?: string) {}
}
