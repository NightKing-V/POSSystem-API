import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetProductsQuery } from './get-products.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<GetProductsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        supplier: true,
        prices: true,
      },
    });
  }
}
