import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetDiscountQuery } from './get-discount.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetDiscountQuery)
export class GetDiscountHandler implements IQueryHandler<GetDiscountQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetDiscountQuery) {
    const { id } = query;
    const discount = await this.prisma.discount.findFirst({
      where: {
        OR: [{ id }, { coup_code: id }],
      },
      include: {
        product_discounts: {
          include: { product: true },
        },
        category_discounts: {
          include: { category: true },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException(
        `Discount/Coupon with ID or code "${id}" not found`,
      );
    }

    return discount;
  }
}
