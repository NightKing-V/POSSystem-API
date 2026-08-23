import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetSupplierQuery } from './get-supplier.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetSupplierQuery)
export class GetSupplierHandler implements IQueryHandler<GetSupplierQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierQuery) {
    const { id } = query;
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, batches: true, purchase_orders: true },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    return supplier;
  }
}
