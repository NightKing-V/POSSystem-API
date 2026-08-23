import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCustomersQuery } from './get-customers.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetCustomersQuery)
export class GetCustomersHandler implements IQueryHandler<GetCustomersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomersQuery) {
    const { orgId } = query;
    return this.prisma.customer.findMany({
      where: {
        deleted_at: null,
        ...(orgId ? { org_id: orgId } : {}),
      },
      include: {
        credit_account: true,
      },
    });
  }
}
