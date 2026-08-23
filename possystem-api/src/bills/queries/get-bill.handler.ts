import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetBillQuery } from './get-bill.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetBillQuery)
export class GetBillHandler implements IQueryHandler<GetBillQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetBillQuery) {
    const { id } = query;
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        cashier: true,
        credit_txs: true,
        loyalty_txs: true,
      },
    });

    if (!bill) {
      throw new NotFoundException(`Bill with ID "${id}" not found`);
    }

    return bill;
  }
}
