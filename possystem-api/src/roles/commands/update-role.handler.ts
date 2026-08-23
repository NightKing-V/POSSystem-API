import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateRoleCommand } from './update-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateRoleCommand) {
    const { id, updateRoleDto } = command;
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    const { permissionIds, ...roleData } = updateRoleDto;

    await this.prisma.role.update({
      where: { id },
      data: {
        name: roleData.name,
        description: roleData.description,
        is_system: roleData.is_system,
        is_location_scoped: roleData.is_location_scoped,
      },
    });

    if (permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({
        where: { role_id: id },
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

        await this.prisma.rolePermission.create({
          data: {
            role_id: id,
            permission_id: permissionId,
          },
        });
      }
    }

    return this.prisma.role.findUnique({
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
