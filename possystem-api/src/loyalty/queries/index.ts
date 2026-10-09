export * from './get-loyalties.query';
export * from './get-loyalties.handler';
export * from './get-loyalty.query';
export * from './get-loyalty.handler';

import { GetLoyaltiesHandler } from './get-loyalties.handler';
import { GetLoyaltyHandler } from './get-loyalty.handler';

export const LoyaltyQueryHandlers = [GetLoyaltiesHandler, GetLoyaltyHandler];
