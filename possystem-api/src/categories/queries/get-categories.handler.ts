import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCategoriesQuery } from './get-categories.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler implements IQueryHandler<GetCategoriesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.productCategory.findMany({
      include: {
        children: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });
  }
}
