import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetOrgRolePermissionsQuery } from './get-org-role-permissions.query';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createPaginatedResult,
  getPaginationParams,
} from '../../common/pagination';

@QueryHandler(GetOrgRolePermissionsQuery)
export class GetOrgRolePermissionsHandler implements IQueryHandler<GetOrgRolePermissionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrgRolePermissionsQuery) {
    const { roleId, queryDto = {} } = query;
    const { resource, action, search } = queryDto;
    const { page, limit, skip, take } = getPaginationParams(
      queryDto.page,
      queryDto.limit,
    );

    const role = await this.prisma.orgRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(
        `Organization role with ID "${roleId}" not found`,
      );
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
        take,
        include: { permission: true },
        orderBy: [
          { permission: { resource: 'asc' } },
          { permission: { action: 'asc' } },
        ],
      }),
      this.prisma.orgRolePermission.count({ where }),
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
        org_id: role.org_id,
        name: role.name,
      },
      ...paginated,
    };
  }
}
