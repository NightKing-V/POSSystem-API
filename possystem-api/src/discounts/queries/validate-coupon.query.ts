import { IQuery } from '@nestjs/cqrs';
import { CouponItemDto } from '../dto/validate-coupon.dto';

export class ValidateCouponQuery implements IQuery {
  constructor(
    public readonly orgId: string,
    public readonly code: string,
    public readonly items?: CouponItemDto[],
  ) {}
}
