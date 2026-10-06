import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCategoriesQuery } from './get-categories.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler implements IQueryHandler<GetCategoriesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCategoriesQuery) {
    const { orgId } = query;
    return this.prisma.productCategory.findMany({
      where: orgId ? { org_id: orgId } : undefined,
      include: {
        children: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });
  }
}
