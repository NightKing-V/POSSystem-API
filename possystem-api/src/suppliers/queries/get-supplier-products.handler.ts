import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetSupplierProductsQuery } from './get-supplier-products.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetSupplierProductsQuery)
export class GetSupplierProductsHandler implements IQueryHandler<GetSupplierProductsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierProductsQuery) {
    const { id } = query;
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    return this.prisma.product.findMany({
      where: { supplier_id: id },
      include: {
        category: true,
        brand: true,
      },
    });
  }
}
