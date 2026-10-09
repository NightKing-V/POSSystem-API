export * from './create-role.command';
export * from './create-role.handler';
export * from './update-role.command';
export * from './update-role.handler';
export * from './delete-role.command';
export * from './delete-role.handler';
export * from './assign-role.command';
export * from './assign-role.handler';
export * from './remove-role.command';
export * from './remove-role.handler';
export * from './add-org-role-permissions.command';
export * from './add-org-role-permissions.handler';
export * from './remove-org-role-permission.command';
export * from './remove-org-role-permission.handler';

import { CreateRoleHandler } from './create-role.handler';
import { UpdateRoleHandler } from './update-role.handler';
import { DeleteRoleHandler } from './delete-role.handler';
import { AssignRoleHandler } from './assign-role.handler';
import { RemoveRoleHandler } from './remove-role.handler';
import { AddOrgRolePermissionsHandler } from './add-org-role-permissions.handler';
import { RemoveOrgRolePermissionHandler } from './remove-org-role-permission.handler';

export const RoleCommandHandlers = [
  CreateRoleHandler,
  UpdateRoleHandler,
  DeleteRoleHandler,
  AssignRoleHandler,
  RemoveRoleHandler,
  AddOrgRolePermissionsHandler,
  RemoveOrgRolePermissionHandler,
];
