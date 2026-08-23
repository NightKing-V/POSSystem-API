import { IQuery } from '@nestjs/cqrs';

export class GetLocationUsersQuery implements IQuery {
  constructor(public readonly locationId: string) {}
}
