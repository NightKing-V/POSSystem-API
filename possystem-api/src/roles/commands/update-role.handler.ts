import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UpdateRoleCommand } from './update-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateRoleCommand) {
    const { id, updateRoleDto } = command;
    const role = await this.prisma.orgRole.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    const { permissionIds, org_id: _ignoredOrgId, ...roleData } = updateRoleDto;

    if (roleData.name && roleData.name !== role.name) {
      const existing = await this.prisma.orgRole.findUnique({
        where: {
          org_id_name: {
            org_id: role.org_id,
            name: roleData.name,
          },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Role "${roleData.name}" already exists in this organization`,
        );
      }
    }

    await this.prisma.orgRole.update({
      where: { id },
      data: {
        name: roleData.name,
        description: roleData.description,
        is_location_scoped: roleData.is_location_scoped,
      },
    });

    if (permissionIds !== undefined) {
      if (role.is_entrypoint && permissionIds.length === 0) {
        throw new BadRequestException(
          'Cannot remove all permissions from the organization entrypoint role',
        );
      }

      await this.prisma.orgRolePermission.deleteMany({
        where: { org_role_id: id },
      });

      for (const permissionId of permissionIds) {
        const permission = await this.prisma.permission.findUnique({
          where: { id: permissionId },
        });

        if (!permission) {
          throw new BadRequestException(
            `Permission with ID "${permissionId}" not found`,
          );
        }

        await this.prisma.orgRolePermission.create({
          data: {
            org_role_id: id,
            permission_id: permissionId,
          },
        });
      }
    }

    return this.prisma.orgRole.findUnique({
      where: { id },
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
