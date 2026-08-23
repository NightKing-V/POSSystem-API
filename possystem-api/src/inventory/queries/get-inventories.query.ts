import { IQuery } from '@nestjs/cqrs';

export class GetInventoriesQuery implements IQuery {
  constructor(public readonly orgId?: string) {}
}
