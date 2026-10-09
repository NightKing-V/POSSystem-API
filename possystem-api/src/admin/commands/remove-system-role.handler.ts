import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { RemoveSystemRoleCommand } from './remove-system-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(RemoveSystemRoleCommand)
export class RemoveSystemRoleHandler implements ICommandHandler<RemoveSystemRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RemoveSystemRoleCommand) {
    const { userId, roleId } = command;

    const existing = await this.prisma.userSystemRole.findUnique({
      where: {
        user_id_system_role_id: {
          user_id: userId,
          system_role_id: roleId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('System role assignment not found');
    }

    return this.prisma.userSystemRole.delete({
      where: {
        user_id_system_role_id: {
          user_id: userId,
          system_role_id: roleId,
        },
      },
    });
  }
}
