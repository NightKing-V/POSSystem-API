import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPurchaseOrderQuery } from './get-purchase-order.query';

@QueryHandler(GetPurchaseOrderQuery)
export class GetPurchaseOrderHandler implements IQueryHandler<GetPurchaseOrderQuery> {
  execute(query: GetPurchaseOrderQuery): Promise<string> {
    const { id } = query;
    return Promise.resolve(`This action returns a #${id} purchaseOrder`);
  }
}
