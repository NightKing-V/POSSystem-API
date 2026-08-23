import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPurchaseOrderQuery } from './get-purchase-order.query';

@QueryHandler(GetPurchaseOrderQuery)
export class GetPurchaseOrderHandler implements IQueryHandler<GetPurchaseOrderQuery> {
  async execute(query: GetPurchaseOrderQuery) {
    const { id } = query;
    return `This action returns a #${id} purchaseOrder`;
  }
}
