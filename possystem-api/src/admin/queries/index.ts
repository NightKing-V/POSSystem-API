export * from './get-system-roles.query';
export * from './get-system-roles.handler';
export * from './get-system-role.query';
export * from './get-system-role.handler';
export * from './get-system-role-permissions.query';
export * from './get-system-role-permissions.handler';
export * from './get-user-system-roles.query';
export * from './get-user-system-roles.handler';
export * from './get-user-system-permissions.query';
export * from './get-user-system-permissions.handler';
export * from './get-permissions.query';
export * from './get-permissions.handler';

import { GetSystemRolesHandler } from './get-system-roles.handler';
import { GetSystemRoleHandler } from './get-system-role.handler';
import { GetSystemRolePermissionsHandler } from './get-system-role-permissions.handler';
import { GetUserSystemRolesHandler } from './get-user-system-roles.handler';
import { GetUserSystemPermissionsHandler } from './get-user-system-permissions.handler';
import { GetPermissionsHandler } from './get-permissions.handler';

export const AdminQueryHandlers = [
  GetSystemRolesHandler,
  GetSystemRoleHandler,
  GetSystemRolePermissionsHandler,
  GetUserSystemRolesHandler,
  GetUserSystemPermissionsHandler,
  GetPermissionsHandler,
];
