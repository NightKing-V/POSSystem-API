export * from './create-role.command';
export * from './create-role.handler';
export * from './update-role.command';
export * from './update-role.handler';
export * from './delete-role.command';
export * from './delete-role.handler';
export * from './create-permission.command';
export * from './create-permission.handler';
export * from './delete-permission.command';
export * from './delete-permission.handler';
export * from './assign-role.command';
export * from './assign-role.handler';
export * from './remove-role.command';
export * from './remove-role.handler';

import { CreateRoleHandler } from './create-role.handler';
import { UpdateRoleHandler } from './update-role.handler';
import { DeleteRoleHandler } from './delete-role.handler';
import { CreatePermissionHandler } from './create-permission.handler';
import { DeletePermissionHandler } from './delete-permission.handler';
import { AssignRoleHandler } from './assign-role.handler';
import { RemoveRoleHandler } from './remove-role.handler';

export const RoleCommandHandlers = [
  CreateRoleHandler,
  UpdateRoleHandler,
  DeleteRoleHandler,
  CreatePermissionHandler,
  DeletePermissionHandler,
  AssignRoleHandler,
  RemoveRoleHandler,
];
