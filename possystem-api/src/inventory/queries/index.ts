export * from './get-inventories.query';
export * from './get-inventories.handler';
export * from './get-inventory.query';
export * from './get-inventory.handler';
export * from './get-location-users.query';
export * from './get-location-users.handler';
export * from './get-user-locations.query';
export * from './get-user-locations.handler';

import { GetInventoriesHandler } from './get-inventories.handler';
import { GetInventoryHandler } from './get-inventory.handler';
import { GetLocationUsersHandler } from './get-location-users.handler';
import { GetUserLocationsHandler } from './get-user-locations.handler';

export const InventoryQueryHandlers = [
  GetInventoriesHandler,
  GetInventoryHandler,
  GetLocationUsersHandler,
  GetUserLocationsHandler,
];
