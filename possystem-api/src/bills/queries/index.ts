export * from './get-bills.query';
export * from './get-bills.handler';
export * from './get-bill.query';
export * from './get-bill.handler';

import { GetBillsHandler } from './get-bills.handler';
import { GetBillHandler } from './get-bill.handler';

export const BillQueryHandlers = [GetBillsHandler, GetBillHandler];
