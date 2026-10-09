import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetSystemRolePermissionsQuery } from './get-system-role-permissions.query';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createPaginatedResult,
  getPaginationParams,
} from '../../common/pagination';

@QueryHandler(GetSystemRolePermissionsQuery)
export class GetSystemRolePermissionsHandler implements IQueryHandler<GetSystemRolePermissionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSystemRolePermissionsQuery) {
    const { roleId, queryDto = {} } = query;
    const { resource, action, search } = queryDto;
    const { page, limit, skip, take } = getPaginationParams(
      queryDto.page,
      queryDto.limit,
    );

    const role = await this.prisma.systemRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`System role with ID "${roleId}" not found`);
    }

    const permissionFilter: Prisma.PermissionWhereInput = {};
    if (resource) permissionFilter.resource = resource;
    if (action) permissionFilter.action = action;
    if (search) {
      permissionFilter.OR = [
        { resource: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const where: Prisma.SystemRolePermissionWhereInput = {
      system_role_id: roleId,
      ...(Object.keys(permissionFilter).length > 0
        ? { permission: permissionFilter }
        : {}),
    };

    const [links, total] = await Promise.all([
      this.prisma.systemRolePermission.findMany({
        where,
        skip,
        take,
        include: { permission: true },
        orderBy: [
          { permission: { resource: 'asc' } },
          { permission: { action: 'asc' } },
        ],
      }),
      this.prisma.systemRolePermission.count({ where }),
    ]);

    const paginated = createPaginatedResult(
      links.map((l) => l.permission),
      total,
      page,
      limit,
    );

    return {
      role: {
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
      },
      ...paginated,
    };
  }
}
