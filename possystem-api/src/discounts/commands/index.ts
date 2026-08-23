export * from './create-discount.command';
export * from './create-discount.handler';
export * from './update-discount.command';
export * from './update-discount.handler';
export * from './delete-discount.command';
export * from './delete-discount.handler';

import { CreateDiscountHandler } from './create-discount.handler';
import { UpdateDiscountHandler } from './update-discount.handler';
import { DeleteDiscountHandler } from './delete-discount.handler';

export const DiscountCommandHandlers = [
  CreateDiscountHandler,
  UpdateDiscountHandler,
  DeleteDiscountHandler,
];
