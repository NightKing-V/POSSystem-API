export * from './delete-bill.command';
export * from './delete-bill.handler';

import { DeleteBillHandler } from './delete-bill.handler';

export const BillCommandHandlers = [DeleteBillHandler];
