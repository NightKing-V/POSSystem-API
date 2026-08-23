export * from './get-products.query';
export * from './get-products.handler';
export * from './get-product.query';
export * from './get-product.handler';
export * from './get-product-prices.query';
export * from './get-product-prices.handler';

import { GetProductsHandler } from './get-products.handler';
import { GetProductHandler } from './get-product.handler';
import { GetProductPricesHandler } from './get-product-prices.handler';

export const ProductQueryHandlers = [
  GetProductsHandler,
  GetProductHandler,
  GetProductPricesHandler,
];
