import { IQuery } from '@nestjs/cqrs';

export class GetDiscountsQuery implements IQuery {
  constructor(public readonly orgId?: string) {}
}
