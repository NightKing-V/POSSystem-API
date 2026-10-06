import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddOrgRolePermissionsCommand } from './add-org-role-permissions.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(AddOrgRolePermissionsCommand)
export class AddOrgRolePermissionsHandler
  implements ICommandHandler<AddOrgRolePermissionsCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AddOrgRolePermissionsCommand) {
    const { roleId, permissionIds } = command;

    const role = await this.prisma.orgRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Organization role with ID "${roleId}" not found`);
    }

    const uniqueIds = Array.from(new Set(permissionIds));

    for (const permissionId of uniqueIds) {
      const permission = await this.prisma.permission.findUnique({
        where: { id: permissionId },
      });
      if (!permission) {
        throw new BadRequestException(
          `Permission with ID "${permissionId}" not found`,
        );
      }

      await this.prisma.orgRolePermission.upsert({
        where: {
          org_role_id_permission_id: {
            org_role_id: roleId,
            permission_id: permissionId,
          },
        },
        update: {},
        create: {
          org_role_id: roleId,
          permission_id: permissionId,
        },
      });
    }

    return this.prisma.orgRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }
}
