import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetCategoryQuery } from './get-category.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCategoryQuery) {
    const { id } = query;
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }
}
