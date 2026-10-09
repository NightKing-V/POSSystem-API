import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPurchaseOrdersQuery } from './get-purchase-orders.query';

@QueryHandler(GetPurchaseOrdersQuery)
export class GetPurchaseOrdersHandler implements IQueryHandler<GetPurchaseOrdersQuery> {
  execute(): Promise<string> {
    return Promise.resolve(`This action returns all purchaseOrders`);
  }
}
