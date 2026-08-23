import { IQuery } from '@nestjs/cqrs';

export class GetInventoryQuery implements IQuery {
  constructor(public readonly id: string) {}
}
