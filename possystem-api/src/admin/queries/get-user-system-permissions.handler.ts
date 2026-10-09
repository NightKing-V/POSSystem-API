import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetUserSystemPermissionsQuery } from './get-user-system-permissions.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetUserSystemPermissionsQuery)
export class GetUserSystemPermissionsHandler implements IQueryHandler<GetUserSystemPermissionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserSystemPermissionsQuery) {
    const { userId } = query;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const userSystemRoles = await this.prisma.userSystemRole.findMany({
      where: { user_id: userId },
      include: {
        system_role: {
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
      {
        id: string;
        resource: string;
        action: string;
        description: string | null;
      }
    >();

    for (const usr of userSystemRoles) {
      for (const rp of usr.system_role.permissions) {
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
      system_roles: userSystemRoles.map((usr) => ({
        id: usr.system_role.id,
        key: usr.system_role.key,
        name: usr.system_role.name,
      })),
      permissions,
    };
  }
}
