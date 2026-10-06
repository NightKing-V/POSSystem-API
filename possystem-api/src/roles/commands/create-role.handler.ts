import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleCommand } from './create-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateRoleCommand) {
    const { createRoleDto } = command;
    const { permissionIds, ...roleData } = createRoleDto;

    const org = await this.prisma.org.findUnique({
      where: { id: roleData.org_id },
    });
    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${roleData.org_id}" not found`,
      );
    }

    const existing = await this.prisma.orgRole.findUnique({
      where: {
        org_id_name: {
          org_id: roleData.org_id,
          name: roleData.name,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Role "${roleData.name}" already exists in this organization`,
      );
    }

    const role = await this.prisma.orgRole.create({
      data: {
        org_id: roleData.org_id,
        name: roleData.name,
        description: roleData.description || null,
        is_builtin: false,
        is_entrypoint: false,
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

        await this.prisma.orgRolePermission.create({
          data: {
            org_role_id: role.id,
            permission_id: permissionId,
          },
        });
      }
    }

    return this.prisma.orgRole.findUnique({
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
