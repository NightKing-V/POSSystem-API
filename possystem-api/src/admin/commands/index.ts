export * from './create-system-role.command';
export * from './create-system-role.handler';
export * from './update-system-role.command';
export * from './update-system-role.handler';
export * from './delete-system-role.command';
export * from './delete-system-role.handler';
export * from './assign-system-role.command';
export * from './assign-system-role.handler';
export * from './remove-system-role.command';
export * from './remove-system-role.handler';
export * from './add-system-role-permissions.command';
export * from './add-system-role-permissions.handler';
export * from './remove-system-role-permission.command';
export * from './remove-system-role-permission.handler';
export * from './create-permission.command';
export * from './create-permission.handler';
export * from './delete-permission.command';
export * from './delete-permission.handler';

import { CreateSystemRoleHandler } from './create-system-role.handler';
import { UpdateSystemRoleHandler } from './update-system-role.handler';
import { DeleteSystemRoleHandler } from './delete-system-role.handler';
import { AssignSystemRoleHandler } from './assign-system-role.handler';
import { RemoveSystemRoleHandler } from './remove-system-role.handler';
import { AddSystemRolePermissionsHandler } from './add-system-role-permissions.handler';
import { RemoveSystemRolePermissionHandler } from './remove-system-role-permission.handler';
import { CreatePermissionHandler } from './create-permission.handler';
import { DeletePermissionHandler } from './delete-permission.handler';

export const AdminCommandHandlers = [
  CreateSystemRoleHandler,
  UpdateSystemRoleHandler,
  DeleteSystemRoleHandler,
  AssignSystemRoleHandler,
  RemoveSystemRoleHandler,
  AddSystemRolePermissionsHandler,
  RemoveSystemRolePermissionHandler,
  CreatePermissionHandler,
  DeletePermissionHandler,
];
