import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetCustomerQuery } from './get-customer.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<GetCustomerQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomerQuery) {
    const { id } = query;
    const customer = await this.prisma.customer.findFirst({
      where: { id, deleted_at: null },
      include: {
        credit_account: true,
        credit_txs: true,
        loyalty_txs: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return customer;
  }
}
