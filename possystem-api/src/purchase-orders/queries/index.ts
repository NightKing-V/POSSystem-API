export * from './get-purchase-orders.query';
export * from './get-purchase-orders.handler';
export * from './get-purchase-order.query';
export * from './get-purchase-order.handler';

import { GetPurchaseOrdersHandler } from './get-purchase-orders.handler';
import { GetPurchaseOrderHandler } from './get-purchase-order.handler';

export const PurchaseOrderQueryHandlers = [
  GetPurchaseOrdersHandler,
  GetPurchaseOrderHandler,
];
