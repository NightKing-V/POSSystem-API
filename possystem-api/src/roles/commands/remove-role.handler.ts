import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RemoveRoleCommand } from './remove-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(RemoveRoleCommand)
export class RemoveRoleHandler implements ICommandHandler<RemoveRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RemoveRoleCommand) {
    const { userId, orgId, roleId } = command;

    const existing = await this.prisma.orgMember.findUnique({
      where: {
        user_id_org_id: {
          user_id: userId,
          org_id: orgId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Organization membership not found');
    }

    if (roleId && existing.role_id !== roleId) {
      throw new BadRequestException(
        `User is not assigned to role "${roleId}" in organization "${orgId}"`,
      );
    }

    return this.prisma.orgMember.delete({
      where: {
        user_id_org_id: {
          user_id: userId,
          org_id: orgId,
        },
      },
    });
  }
}
