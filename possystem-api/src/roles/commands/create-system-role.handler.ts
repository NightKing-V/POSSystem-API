import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreateSystemRoleCommand } from './create-system-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateSystemRoleCommand)
export class CreateSystemRoleHandler
  implements ICommandHandler<CreateSystemRoleCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateSystemRoleCommand) {
    const { createSystemRoleDto } = command;
    const { permissionIds, ...roleData } = createSystemRoleDto;

    const normalizedKey = (
      roleData.key || roleData.name.trim().toUpperCase().replace(/\s+/g, '_')
    ).toUpperCase();

    const existing = await this.prisma.systemRole.findUnique({
      where: { key: normalizedKey },
    });
    if (existing) {
      throw new ConflictException(
        `System role with key "${normalizedKey}" already exists`,
      );
    }

    const role = await this.prisma.systemRole.create({
      data: {
        key: normalizedKey,
        name: roleData.name,
        description: roleData.description || null,
        is_org_template: roleData.is_org_template ?? false,
        is_org_entrypoint: roleData.is_org_entrypoint ?? false,
        is_location_scoped: roleData.is_location_scoped ?? false,
      },
    });

    if (permissionIds && permissionIds.length > 0) {
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
            system_role_id: role.id,
            permission_id: permissionId,
          },
        });
      }
    }

    return this.prisma.systemRole.findUnique({
      where: { id: role.id },
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
