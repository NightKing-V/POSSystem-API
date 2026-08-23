import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetProductPricesQuery } from './get-product-prices.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetProductPricesQuery)
export class GetProductPricesHandler implements IQueryHandler<GetProductPricesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductPricesQuery) {
    const { productId } = query;
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    return this.prisma.productPrice.findMany({
      where: { productid: productId },
      orderBy: { effectivefrom: 'desc' },
    });
  }
}
