import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSuppliersQuery } from './get-suppliers.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetSuppliersQuery)
export class GetSuppliersHandler implements IQueryHandler<GetSuppliersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSuppliersQuery) {
    const { orgId } = query;
    return this.prisma.supplier.findMany({
      where: orgId ? { org_id: orgId } : undefined,
      include: {
        _count: {
          select: { products: true, batches: true, purchase_orders: true },
        },
      },
    });
  }
}
