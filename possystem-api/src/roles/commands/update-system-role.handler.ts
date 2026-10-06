import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateSystemRoleCommand } from './update-system-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateSystemRoleCommand)
export class UpdateSystemRoleHandler
  implements ICommandHandler<UpdateSystemRoleCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSystemRoleCommand) {
    const { id, updateSystemRoleDto } = command;
    const role = await this.prisma.systemRole.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`System role with ID "${id}" not found`);
    }

    const { permissionIds, ...roleData } = updateSystemRoleDto;

    if (roleData.key && roleData.key !== role.key) {
      const existing = await this.prisma.systemRole.findUnique({
        where: { key: roleData.key },
      });
      if (existing) {
        throw new ConflictException(
          `System role with key "${roleData.key}" already exists`,
        );
      }
    }

    await this.prisma.systemRole.update({
      where: { id },
      data: {
        key: roleData.key,
        name: roleData.name,
        description: roleData.description,
        is_org_template: roleData.is_org_template,
        is_org_entrypoint: roleData.is_org_entrypoint,
        is_location_scoped: roleData.is_location_scoped,
      },
    });

    if (permissionIds !== undefined) {
      await this.prisma.systemRolePermission.deleteMany({
        where: { system_role_id: id },
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

        await this.prisma.systemRolePermission.create({
          data: {
            system_role_id: id,
            permission_id: permissionId,
          },
        });
      }
    }

    return this.prisma.systemRole.findUnique({
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
