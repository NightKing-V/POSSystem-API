import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetProductsQuery } from './get-products.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<GetProductsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductsQuery) {
    const { orgId } = query;
    return this.prisma.product.findMany({
      where: orgId ? { org_id: orgId } : undefined,
      include: {
        category: true,
        brand: true,
        supplier: true,
        prices: true,
      },
    });
  }
}
