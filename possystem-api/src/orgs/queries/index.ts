export * from './get-orgs.query';
export * from './get-orgs.handler';
export * from './get-org.query';
export * from './get-org.handler';

import { GetOrgsHandler } from './get-orgs.handler';
import { GetOrgHandler } from './get-org.handler';

export const OrgQueryHandlers = [GetOrgsHandler, GetOrgHandler];
