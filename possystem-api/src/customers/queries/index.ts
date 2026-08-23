export * from './get-customers.query';
export * from './get-customers.handler';
export * from './get-customer.query';
export * from './get-customer.handler';

import { GetCustomersHandler } from './get-customers.handler';
import { GetCustomerHandler } from './get-customer.handler';

export const CustomerQueryHandlers = [
  GetCustomersHandler,
  GetCustomerHandler,
];
