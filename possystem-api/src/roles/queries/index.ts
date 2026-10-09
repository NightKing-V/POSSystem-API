export * from './get-roles.query';
export * from './get-roles.handler';
export * from './get-role.query';
export * from './get-role.handler';
export * from './get-org-role-permissions.query';
export * from './get-org-role-permissions.handler';
export * from './get-user-roles.query';
export * from './get-user-roles.handler';
export * from './get-user-org-permissions.query';
export * from './get-user-org-permissions.handler';

import { GetRolesHandler } from './get-roles.handler';
import { GetRoleHandler } from './get-role.handler';
import { GetOrgRolePermissionsHandler } from './get-org-role-permissions.handler';
import { GetUserRolesHandler } from './get-user-roles.handler';
import { GetUserOrgPermissionsHandler } from './get-user-org-permissions.handler';

export const RoleQueryHandlers = [
  GetRolesHandler,
  GetRoleHandler,
  GetOrgRolePermissionsHandler,
  GetUserRolesHandler,
  GetUserOrgPermissionsHandler,
];
