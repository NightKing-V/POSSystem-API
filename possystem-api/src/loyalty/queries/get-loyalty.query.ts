import { IQuery } from '@nestjs/cqrs';

export class GetLoyaltyQuery implements IQuery {
  constructor(public readonly id: number) {}
}
