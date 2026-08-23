export * from './create-supplier.command';
export * from './create-supplier.handler';
export * from './update-supplier.command';
export * from './update-supplier.handler';
export * from './delete-supplier.command';
export * from './delete-supplier.handler';

import { CreateSupplierHandler } from './create-supplier.handler';
import { UpdateSupplierHandler } from './update-supplier.handler';
import { DeleteSupplierHandler } from './delete-supplier.handler';

export const SupplierCommandHandlers = [
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
];
