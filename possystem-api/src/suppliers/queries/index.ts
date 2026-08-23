export * from './get-suppliers.query';
export * from './get-suppliers.handler';
export * from './get-supplier.query';
export * from './get-supplier.handler';
export * from './get-supplier-products.query';
export * from './get-supplier-products.handler';

import { GetSuppliersHandler } from './get-suppliers.handler';
import { GetSupplierHandler } from './get-supplier.handler';
import { GetSupplierProductsHandler } from './get-supplier-products.handler';

export const SupplierQueryHandlers = [
  GetSuppliersHandler,
  GetSupplierHandler,
  GetSupplierProductsHandler,
];
