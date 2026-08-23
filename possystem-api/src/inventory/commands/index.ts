export * from './create-inventory.command';
export * from './create-inventory.handler';
export * from './update-inventory.command';
export * from './update-inventory.handler';
export * from './delete-inventory.command';
export * from './delete-inventory.handler';
export * from './assign-user-location.command';
export * from './assign-user-location.handler';
export * from './unassign-user-location.command';
export * from './unassign-user-location.handler';

import { CreateInventoryHandler } from './create-inventory.handler';
import { UpdateInventoryHandler } from './update-inventory.handler';
import { DeleteInventoryHandler } from './delete-inventory.handler';
import { AssignUserLocationHandler } from './assign-user-location.handler';
import { UnassignUserLocationHandler } from './unassign-user-location.handler';

export const InventoryCommandHandlers = [
  CreateInventoryHandler,
  UpdateInventoryHandler,
  DeleteInventoryHandler,
  AssignUserLocationHandler,
  UnassignUserLocationHandler,
];
