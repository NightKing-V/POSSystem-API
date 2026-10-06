import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetUserOrgPermissionsQuery } from './get-user-org-permissions.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetUserOrgPermissionsQuery)
export class GetUserOrgPermissionsHandler
  implements IQueryHandler<GetUserOrgPermissionsQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserOrgPermissionsQuery) {
    const { userId, orgId } = query;

    const [user, org] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.org.findUnique({ where: { id: orgId } }),
    ]);

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        user_id: userId,
        org_id: orgId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissionMap = new Map<
      string,
      { id: string; resource: string; action: string; description: string | null }
    >();

    for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
        permissionMap.set(rp.permission.id, rp.permission);
      }
    }

    const permissions = Array.from(permissionMap.values()).sort((a, b) =>
      a.resource === b.resource
        ? a.action.localeCompare(b.action)
        : a.resource.localeCompare(b.resource),
    );

    return {
      user_id: userId,
      org_id: orgId,
      roles: userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        is_location_scoped: ur.role.is_location_scoped,
      })),
      permissions,
    };
  }
}
