export * from './update-org.command';
export * from './update-org.handler';

import { UpdateOrgHandler } from './update-org.handler';

export const OrgCommandHandlers = [UpdateOrgHandler];

