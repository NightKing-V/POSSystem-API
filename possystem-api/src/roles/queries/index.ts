export * from './get-roles.query';
export * from './get-roles.handler';
export * from './get-role.query';
export * from './get-role.handler';
export * from './get-permissions.query';
export * from './get-permissions.handler';
export * from './get-user-roles.query';
export * from './get-user-roles.handler';

import { GetRolesHandler } from './get-roles.handler';
import { GetRoleHandler } from './get-role.handler';
import { GetPermissionsHandler } from './get-permissions.handler';
import { GetUserRolesHandler } from './get-user-roles.handler';

export const RoleQueryHandlers = [
  GetRolesHandler,
  GetRoleHandler,
  GetPermissionsHandler,
  GetUserRolesHandler,
];
