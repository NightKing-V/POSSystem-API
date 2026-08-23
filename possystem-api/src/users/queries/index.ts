export * from './get-users.query';
export * from './get-users.handler';
export * from './get-user.query';
export * from './get-user.handler';

import { GetUsersHandler } from './get-users.handler';
import { GetUserHandler } from './get-user.handler';

export const UserQueryHandlers = [GetUsersHandler, GetUserHandler];
