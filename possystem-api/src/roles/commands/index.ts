export * from './create-role.command';
export * from './create-role.handler';
export * from './update-role.command';
export * from './update-role.handler';
export * from './delete-role.command';
export * from './delete-role.handler';
export * from './create-system-role.command';
export * from './create-system-role.handler';
export * from './update-system-role.command';
export * from './update-system-role.handler';
export * from './delete-system-role.command';
export * from './delete-system-role.handler';
export * from './create-permission.command';
export * from './create-permission.handler';
export * from './delete-permission.command';
export * from './delete-permission.handler';
export * from './assign-role.command';
export * from './assign-role.handler';
export * from './remove-role.command';
export * from './remove-role.handler';
export * from './assign-system-role.command';
export * from './assign-system-role.handler';
export * from './remove-system-role.command';
export * from './remove-system-role.handler';
export * from './add-org-role-permissions.command';
export * from './add-org-role-permissions.handler';
export * from './remove-org-role-permission.command';
export * from './remove-org-role-permission.handler';
export * from './add-system-role-permissions.command';
export * from './add-system-role-permissions.handler';
export * from './remove-system-role-permission.command';
export * from './remove-system-role-permission.handler';

import { CreateRoleHandler } from './create-role.handler';
import { UpdateRoleHandler } from './update-role.handler';
import { DeleteRoleHandler } from './delete-role.handler';
import { CreateSystemRoleHandler } from './create-system-role.handler';
import { UpdateSystemRoleHandler } from './update-system-role.handler';
import { DeleteSystemRoleHandler } from './delete-system-role.handler';
import { CreatePermissionHandler } from './create-permission.handler';
import { DeletePermissionHandler } from './delete-permission.handler';
import { AssignRoleHandler } from './assign-role.handler';
import { RemoveRoleHandler } from './remove-role.handler';
import { AssignSystemRoleHandler } from './assign-system-role.handler';
import { RemoveSystemRoleHandler } from './remove-system-role.handler';
import { AddOrgRolePermissionsHandler } from './add-org-role-permissions.handler';
import { RemoveOrgRolePermissionHandler } from './remove-org-role-permission.handler';
import { AddSystemRolePermissionsHandler } from './add-system-role-permissions.handler';
import { RemoveSystemRolePermissionHandler } from './remove-system-role-permission.handler';

export const RoleCommandHandlers = [
  CreateRoleHandler,
  UpdateRoleHandler,
  DeleteRoleHandler,
  CreateSystemRoleHandler,
  UpdateSystemRoleHandler,
  DeleteSystemRoleHandler,
  CreatePermissionHandler,
  DeletePermissionHandler,
  AssignRoleHandler,
  RemoveRoleHandler,
  AssignSystemRoleHandler,
  RemoveSystemRoleHandler,
  AddOrgRolePermissionsHandler,
  RemoveOrgRolePermissionHandler,
  AddSystemRolePermissionsHandler,
  RemoveSystemRolePermissionHandler,
];


