import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetBrandQuery } from './get-brand.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetBrandQuery)
export class GetBrandHandler implements IQueryHandler<GetBrandQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetBrandQuery) {
    const { id } = query;
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }

    return brand;
  }
}
