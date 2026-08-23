export * from './get-discounts.query';
export * from './get-discounts.handler';
export * from './get-discount.query';
export * from './get-discount.handler';
export * from './validate-coupon.query';
export * from './validate-coupon.handler';

import { GetDiscountsHandler } from './get-discounts.handler';
import { GetDiscountHandler } from './get-discount.handler';
import { ValidateCouponHandler } from './validate-coupon.handler';

export const DiscountQueryHandlers = [
  GetDiscountsHandler,
  GetDiscountHandler,
  ValidateCouponHandler,
];
