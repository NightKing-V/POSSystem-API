export * from './create-product.command';
export * from './create-product.handler';
export * from './update-product.command';
export * from './update-product.handler';
export * from './delete-product.command';
export * from './delete-product.handler';
export * from './create-product-price.command';
export * from './create-product-price.handler';
export * from './update-product-price.command';
export * from './update-product-price.handler';
export * from './delete-product-price.command';
export * from './delete-product-price.handler';

import { CreateProductHandler } from './create-product.handler';
import { UpdateProductHandler } from './update-product.handler';
import { DeleteProductHandler } from './delete-product.handler';
import { CreateProductPriceHandler } from './create-product-price.handler';
import { UpdateProductPriceHandler } from './update-product-price.handler';
import { DeleteProductPriceHandler } from './delete-product-price.handler';

export const ProductCommandHandlers = [
  CreateProductHandler,
  UpdateProductHandler,
  DeleteProductHandler,
  CreateProductPriceHandler,
  UpdateProductPriceHandler,
  DeleteProductPriceHandler,
];
