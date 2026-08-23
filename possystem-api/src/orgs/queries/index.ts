export * from './get-orgs.query';
export * from './get-orgs.handler';
export * from './get-org.query';
export * from './get-org.handler';
export * from './get-business-categories.query';
export * from './get-business-categories.handler';

import { GetOrgsHandler } from './get-orgs.handler';
import { GetOrgHandler } from './get-org.handler';
import { GetBusinessCategoriesHandler } from './get-business-categories.handler';

export const OrgQueryHandlers = [
  GetOrgsHandler,
  GetOrgHandler,
  GetBusinessCategoriesHandler,
];
