export * from './get-brands.query';
export * from './get-brands.handler';
export * from './get-brand.query';
export * from './get-brand.handler';

import { GetBrandsHandler } from './get-brands.handler';
import { GetBrandHandler } from './get-brand.handler';

export const BrandQueryHandlers = [GetBrandsHandler, GetBrandHandler];
