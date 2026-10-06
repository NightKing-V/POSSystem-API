import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetOrgRolePermissionsQuery } from './get-org-role-permissions.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetOrgRolePermissionsQuery)
export class GetOrgRolePermissionsHandler
  implements IQueryHandler<GetOrgRolePermissionsQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrgRolePermissionsQuery) {
    const { roleId, queryDto = {} } = query;
    const { page = 1, limit = 20, resource, action, search } = queryDto;

    const role = await this.prisma.orgRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Organization role with ID "${roleId}" not found`);
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

    const where: Prisma.OrgRolePermissionWhereInput = {
      org_role_id: roleId,
      ...(Object.keys(permissionFilter).length > 0
        ? { permission: permissionFilter }
        : {}),
    };

    const [links, total] = await Promise.all([
      this.prisma.orgRolePermission.findMany({
        where,
        skip,
        take: safeLimit,
        include: { permission: true },
        orderBy: [
          { permission: { resource: 'asc' } },
          { permission: { action: 'asc' } },
        ],
      }),
      this.prisma.orgRolePermission.count({ where }),
    ]);

    return {
      role: {
        id: role.id,
        org_id: role.org_id,
        name: role.name,
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
