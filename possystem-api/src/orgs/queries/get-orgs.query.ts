import { IQuery } from '@nestjs/cqrs';

export class GetOrgsQuery implements IQuery {
  constructor(public readonly userId?: string) {}
}
