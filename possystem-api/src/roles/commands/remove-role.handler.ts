import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { RemoveRoleCommand } from './remove-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(RemoveRoleCommand)
export class RemoveRoleHandler implements ICommandHandler<RemoveRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RemoveRoleCommand) {
    const { userId, orgId, roleId } = command;

    const existing = await this.prisma.userRole.findUnique({
      where: {
        user_id_role_id_org_id: {
          user_id: userId,
          role_id: roleId,
          org_id: orgId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Role assignment not found');
    }

    return this.prisma.userRole.delete({
      where: {
        user_id_role_id_org_id: {
          user_id: userId,
          role_id: roleId,
          org_id: orgId,
        },
      },
    });
  }
}
