import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddSystemRolePermissionsCommand } from './add-system-role-permissions.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(AddSystemRolePermissionsCommand)
export class AddSystemRolePermissionsHandler
  implements ICommandHandler<AddSystemRolePermissionsCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AddSystemRolePermissionsCommand) {
    const { roleId, permissionIds } = command;

    const role = await this.prisma.systemRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`System role with ID "${roleId}" not found`);
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

      await this.prisma.systemRolePermission.upsert({
        where: {
          system_role_id_permission_id: {
            system_role_id: roleId,
            permission_id: permissionId,
          },
        },
        update: {},
        create: {
          system_role_id: roleId,
          permission_id: permissionId,
        },
      });
    }

    return this.prisma.systemRole.findUnique({
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
