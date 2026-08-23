export * from './create-customer.command';
export * from './create-customer.handler';
export * from './update-customer.command';
export * from './update-customer.handler';
export * from './delete-customer.command';
export * from './delete-customer.handler';

import { CreateCustomerHandler } from './create-customer.handler';
import { UpdateCustomerHandler } from './update-customer.handler';
import { DeleteCustomerHandler } from './delete-customer.handler';

export const CustomerCommandHandlers = [
  CreateCustomerHandler,
  UpdateCustomerHandler,
  DeleteCustomerHandler,
];
