import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDiscountsQuery } from './get-discounts.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetDiscountsQuery)
export class GetDiscountsHandler implements IQueryHandler<GetDiscountsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.discount.findMany({
      include: {
        product_discounts: {
          include: { product: true },
        },
        category_discounts: {
          include: { category: true },
        },
      },
    });
  }
}
