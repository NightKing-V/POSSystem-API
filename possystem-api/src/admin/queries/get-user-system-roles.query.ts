import { IQuery } from '@nestjs/cqrs';

export class GetUserSystemRolesQuery implements IQuery {
  constructor(public readonly userId: string) {}
}
