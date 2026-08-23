export * from './update-org.command';
export * from './update-org.handler';
export * from './delete-org.command';
export * from './delete-org.handler';

import { UpdateOrgHandler } from './update-org.handler';
import { DeleteOrgHandler } from './delete-org.handler';

export const OrgCommandHandlers = [UpdateOrgHandler, DeleteOrgHandler];
