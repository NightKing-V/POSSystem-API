import { IQuery } from '@nestjs/cqrs';

export class GetBrandsQuery implements IQuery {
  constructor(public readonly orgId?: string) {}
}
