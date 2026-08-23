import { IQuery } from '@nestjs/cqrs';

export class GetOrgQuery implements IQuery {
  constructor(public readonly id: string) {}
}
