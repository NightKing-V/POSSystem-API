import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBrandsQuery } from './get-brands.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetBrandsQuery)
export class GetBrandsHandler implements IQueryHandler<GetBrandsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }
}
