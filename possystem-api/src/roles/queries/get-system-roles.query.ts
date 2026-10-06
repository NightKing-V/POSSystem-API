import { IQuery } from '@nestjs/cqrs';

export class GetSystemRolesQuery implements IQuery {
  constructor(public readonly isOrgTemplate?: boolean) {}
}
