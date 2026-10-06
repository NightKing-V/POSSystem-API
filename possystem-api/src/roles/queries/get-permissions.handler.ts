import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { GetPermissionsQuery } from './get-permissions.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetPermissionsQuery)
export class GetPermissionsHandler
  implements IQueryHandler<GetPermissionsQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPermissionsQuery) {
    const {
      page = 1,
      limit = 20,
      resource,
      action,
      search,
    } = query?.queryDto || {};

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(200, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.PermissionWhereInput = {};

    if (resource) {
      where.resource = resource;
    }

    if (action) {
      where.action = action;
    }

    if (search) {
      where.OR = [
        { resource: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }
}
