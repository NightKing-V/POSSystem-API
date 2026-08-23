export * from './create-loyalty.command';
export * from './create-loyalty.handler';
export * from './update-loyalty.command';
export * from './update-loyalty.handler';
export * from './delete-loyalty.command';
export * from './delete-loyalty.handler';

import { CreateLoyaltyHandler } from './create-loyalty.handler';
import { UpdateLoyaltyHandler } from './update-loyalty.handler';
import { DeleteLoyaltyHandler } from './delete-loyalty.handler';

export const LoyaltyCommandHandlers = [
  CreateLoyaltyHandler,
  UpdateLoyaltyHandler,
  DeleteLoyaltyHandler,
];
