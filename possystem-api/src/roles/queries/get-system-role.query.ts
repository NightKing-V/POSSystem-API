import { IQuery } from '@nestjs/cqrs';

export class GetSystemRoleQuery implements IQuery {
  constructor(public readonly id: string) {}
}
