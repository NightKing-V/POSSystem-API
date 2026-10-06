import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { RemoveOrgRolePermissionCommand } from './remove-org-role-permission.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(RemoveOrgRolePermissionCommand)
export class RemoveOrgRolePermissionHandler
  implements ICommandHandler<RemoveOrgRolePermissionCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RemoveOrgRolePermissionCommand) {
    const { roleId, permissionId } = command;

    const existing = await this.prisma.orgRolePermission.findUnique({
      where: {
        org_role_id_permission_id: {
          org_role_id: roleId,
          permission_id: permissionId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Permission "${permissionId}" is not assigned to organization role "${roleId}"`,
      );
    }

    await this.prisma.orgRolePermission.delete({
      where: {
        org_role_id_permission_id: {
          org_role_id: roleId,
          permission_id: permissionId,
        },
      },
    });

    return {
      message: 'Permission removed from organization role successfully',
      org_role_id: roleId,
      permission_id: permissionId,
    };
  }
}
