import { IQuery } from '@nestjs/cqrs';

export class GetSupplierQuery implements IQuery {
  constructor(public readonly id: string) {}
}
