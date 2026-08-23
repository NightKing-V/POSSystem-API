import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetInventoriesQuery } from './get-inventories.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetInventoriesQuery)
export class GetInventoriesHandler implements IQueryHandler<GetInventoriesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetInventoriesQuery) {
    const { orgId } = query;
    return this.prisma.inventoryLocation.findMany({
      where: orgId ? { org_id: orgId } : undefined,
      include: {
        org: true,
        _count: {
          select: {
            user_locations: true,
            stocks: true,
            transactions: true,
            pos: true,
            bills: true,
          },
        },
      },
    });
  }
}
