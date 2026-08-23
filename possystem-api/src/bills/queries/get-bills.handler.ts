import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBillsQuery } from './get-bills.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetBillsQuery)
export class GetBillsHandler implements IQueryHandler<GetBillsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetBillsQuery) {
    const { orgId, locationId, customerId } = query;
    return this.prisma.bill.findMany({
      where: {
        ...(orgId ? { org_id: orgId } : {}),
        ...(locationId ? { location_id: locationId } : {}),
        ...(customerId ? { customer_id: customerId } : {}),
      },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        cashier: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
