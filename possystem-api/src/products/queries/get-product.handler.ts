import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetProductQuery } from './get-product.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductQuery) {
    const { id } = query;
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        supplier: true,
        prices: true,
        _count: {
          select: {
            stock_batches: true,
            po_items: true,
            bill_items: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }
}
