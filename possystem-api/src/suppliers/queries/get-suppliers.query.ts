import { IQuery } from '@nestjs/cqrs';

export class GetSuppliersQuery implements IQuery {
  constructor(public readonly orgId?: string) {}
}
