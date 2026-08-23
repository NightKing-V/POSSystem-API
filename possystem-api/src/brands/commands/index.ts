export * from './create-brand.command';
export * from './create-brand.handler';
export * from './update-brand.command';
export * from './update-brand.handler';
export * from './delete-brand.command';
export * from './delete-brand.handler';

import { CreateBrandHandler } from './create-brand.handler';
import { UpdateBrandHandler } from './update-brand.handler';
import { DeleteBrandHandler } from './delete-brand.handler';

export const BrandCommandHandlers = [
  CreateBrandHandler,
  UpdateBrandHandler,
  DeleteBrandHandler,
];
