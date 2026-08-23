import { IQuery } from '@nestjs/cqrs';

export class GetBillQuery implements IQuery {
  constructor(public readonly id: string) {}
}
