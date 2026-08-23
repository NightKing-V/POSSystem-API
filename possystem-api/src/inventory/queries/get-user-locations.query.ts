import { IQuery } from '@nestjs/cqrs';

export class GetUserLocationsQuery implements IQuery {
  constructor(public readonly userId: string) {}
}
