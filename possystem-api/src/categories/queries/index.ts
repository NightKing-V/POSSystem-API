export * from './get-categories.query';
export * from './get-categories.handler';
export * from './get-category.query';
export * from './get-category.handler';

import { GetCategoriesHandler } from './get-categories.handler';
import { GetCategoryHandler } from './get-category.handler';

export const CategoryQueryHandlers = [GetCategoriesHandler, GetCategoryHandler];
