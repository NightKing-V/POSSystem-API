import { IQuery } from '@nestjs/cqrs';

export class GetRolesQuery implements IQuery {
  constructor(public readonly orgId?: string) {}
}
