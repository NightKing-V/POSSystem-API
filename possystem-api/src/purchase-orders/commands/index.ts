export * from './create-purchase-order.command';
export * from './create-purchase-order.handler';
export * from './update-purchase-order.command';
export * from './update-purchase-order.handler';
export * from './delete-purchase-order.command';
export * from './delete-purchase-order.handler';

import { CreatePurchaseOrderHandler } from './create-purchase-order.handler';
import { UpdatePurchaseOrderHandler } from './update-purchase-order.handler';
import { DeletePurchaseOrderHandler } from './delete-purchase-order.handler';

export const PurchaseOrderCommandHandlers = [
  CreatePurchaseOrderHandler,
  UpdatePurchaseOrderHandler,
  DeletePurchaseOrderHandler,
];
