export * from './create-user.command';
export * from './create-user.handler';
export * from './update-user.command';
export * from './update-user.handler';
export * from './delete-user.command';
export * from './delete-user.handler';

import { CreateUserHandler } from './create-user.handler';
import { UpdateUserHandler } from './update-user.handler';
import { DeleteUserHandler } from './delete-user.handler';

export const UserCommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
];
