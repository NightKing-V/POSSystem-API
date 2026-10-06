import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { CouponItemDto } from './dto/validate-coupon.dto';
import { CreateDiscountCommand } from './commands/create-discount.command';
import { UpdateDiscountCommand } from './commands/update-discount.command';
import { DeleteDiscountCommand } from './commands/delete-discount.command';
import { GetDiscountsQuery } from './queries/get-discounts.query';
import { GetDiscountQuery } from './queries/get-discount.query';
import { ValidateCouponQuery } from './queries/validate-coupon.query';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createDiscountDto: CreateDiscountDto) {
    return this.commandBus.execute(
      new CreateDiscountCommand(createDiscountDto),
    );
  }

  async findAll(orgId?: string) {
    return this.queryBus.execute(new GetDiscountsQuery(orgId));
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetDiscountQuery(id));
  }

  async update(id: string, updateDiscountDto: UpdateDiscountDto) {
    return this.commandBus.execute(
      new UpdateDiscountCommand(id, updateDiscountDto),
    );
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteDiscountCommand(id));
  }

  async validateCoupon(
    orgId: string,
    code: string,
    items?: CouponItemDto[],
  ) {
    return this.queryBus.execute(new ValidateCouponQuery(orgId, code, items));
  }
}
