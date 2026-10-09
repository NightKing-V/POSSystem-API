import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { RemoveSystemRolePermissionCommand } from './remove-system-role-permission.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(RemoveSystemRolePermissionCommand)
export class RemoveSystemRolePermissionHandler implements ICommandHandler<RemoveSystemRolePermissionCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RemoveSystemRolePermissionCommand) {
    const { roleId, permissionId } = command;

    const existing = await this.prisma.systemRolePermission.findUnique({
      where: {
        system_role_id_permission_id: {
          system_role_id: roleId,
          permission_id: permissionId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Permission "${permissionId}" is not assigned to system role "${roleId}"`,
      );
    }

    await this.prisma.systemRolePermission.delete({
      where: {
        system_role_id_permission_id: {
          system_role_id: roleId,
          permission_id: permissionId,
        },
      },
    });

    return {
      message: 'Permission removed from system role successfully',
      system_role_id: roleId,
      permission_id: permissionId,
    };
  }
}
