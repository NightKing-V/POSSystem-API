import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetSystemRolePermissionsQuery } from './get-system-role-permissions.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetSystemRolePermissionsQuery)
export class GetSystemRolePermissionsHandler
  implements IQueryHandler<GetSystemRolePermissionsQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSystemRolePermissionsQuery) {
    const { roleId, queryDto = {} } = query;
    const { page = 1, limit = 20, resource, action, search } = queryDto;

    const role = await this.prisma.systemRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`System role with ID "${roleId}" not found`);
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(200, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

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
        take: safeLimit,
        include: { permission: true },
        orderBy: [
          { permission: { resource: 'asc' } },
          { permission: { action: 'asc' } },
        ],
      }),
      this.prisma.systemRolePermission.count({ where }),
    ]);

    return {
      role: {
        id: role.id,
        key: role.key,
        name: role.name,
        is_org_template: role.is_org_template,
      },
      data: links.map((l) => l.permission),
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }
}
