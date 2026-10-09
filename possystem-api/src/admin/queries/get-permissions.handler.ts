import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { GetPermissionsQuery } from './get-permissions.query';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createPaginatedResult,
  getPaginationParams,
} from '../../common/pagination';

@QueryHandler(GetPermissionsQuery)
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPermissionsQuery) {
    const queryDto = query?.queryDto || {};
    const { resource, action, search } = queryDto;
    const { page, limit, skip, take } = getPaginationParams(
      queryDto.page,
      queryDto.limit,
    );

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
        take,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      }),
      this.prisma.permission.count({ where }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }
}
