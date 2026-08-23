import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPurchaseOrdersQuery } from './get-purchase-orders.query';

@QueryHandler(GetPurchaseOrdersQuery)
export class GetPurchaseOrdersHandler implements IQueryHandler<GetPurchaseOrdersQuery> {
  async execute() {
    return `This action returns all purchaseOrders`;
  }
}
