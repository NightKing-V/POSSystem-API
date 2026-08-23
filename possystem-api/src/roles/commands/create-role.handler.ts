import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { CreateRoleCommand } from './create-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateRoleCommand) {
    const { createRoleDto } = command;
    const { permissionIds, ...roleData } = createRoleDto;

    const role = await this.prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description || null,
        is_system: roleData.is_system || false,
        is_location_scoped: roleData.is_location_scoped || false,
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

        await this.prisma.rolePermission.create({
          data: {
            role_id: role.id,
            permission_id: permissionId,
          },
        });
      }
    }

    return this.prisma.role.findUnique({
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
