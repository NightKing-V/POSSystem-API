export * from './get-roles.query';
export * from './get-roles.handler';
export * from './get-role.query';
export * from './get-role.handler';
export * from './get-system-roles.query';
export * from './get-system-roles.handler';
export * from './get-system-role.query';
export * from './get-system-role.handler';
export * from './get-permissions.query';
export * from './get-permissions.handler';
export * from './get-org-role-permissions.query';
export * from './get-org-role-permissions.handler';
export * from './get-system-role-permissions.query';
export * from './get-system-role-permissions.handler';
export * from './get-user-roles.query';
export * from './get-user-roles.handler';
export * from './get-user-system-roles.query';
export * from './get-user-system-roles.handler';
export * from './get-user-org-permissions.query';
export * from './get-user-org-permissions.handler';
export * from './get-user-system-permissions.query';
export * from './get-user-system-permissions.handler';

import { GetRolesHandler } from './get-roles.handler';
import { GetRoleHandler } from './get-role.handler';
import { GetSystemRolesHandler } from './get-system-roles.handler';
import { GetSystemRoleHandler } from './get-system-role.handler';
import { GetPermissionsHandler } from './get-permissions.handler';
import { GetOrgRolePermissionsHandler } from './get-org-role-permissions.handler';
import { GetSystemRolePermissionsHandler } from './get-system-role-permissions.handler';
import { GetUserRolesHandler } from './get-user-roles.handler';
import { GetUserSystemRolesHandler } from './get-user-system-roles.handler';
import { GetUserOrgPermissionsHandler } from './get-user-org-permissions.handler';
import { GetUserSystemPermissionsHandler } from './get-user-system-permissions.handler';

export const RoleQueryHandlers = [
  GetRolesHandler,
  GetRoleHandler,
  GetSystemRolesHandler,
  GetSystemRoleHandler,
  GetPermissionsHandler,
  GetOrgRolePermissionsHandler,
  GetSystemRolePermissionsHandler,
  GetUserRolesHandler,
  GetUserSystemRolesHandler,
  GetUserOrgPermissionsHandler,
  GetUserSystemPermissionsHandler,
];


