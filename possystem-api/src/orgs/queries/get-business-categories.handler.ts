import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBusinessCategoriesQuery } from './get-business-categories.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetBusinessCategoriesQuery)
export class GetBusinessCategoriesHandler implements IQueryHandler<GetBusinessCategoriesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.businessCategory.findMany({
      orderBy: { type: 'asc' },
    });
  }
}
