import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignRoleCommand } from './assign-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(AssignRoleCommand)
export class AssignRoleHandler implements ICommandHandler<AssignRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AssignRoleCommand) {
    const { userId, orgId, roleId, assignerId } = command;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const org = await this.prisma.org.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    const role = await this.prisma.orgRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found`);
    }

    if (role.org_id !== orgId) {
      throw new BadRequestException(
        `Role with ID "${roleId}" does not belong to organization "${orgId}"`,
      );
    }

    return this.prisma.orgMember.upsert({
      where: {
        user_id_org_id: {
          user_id: userId,
          org_id: orgId,
        },
      },
      update: {
        role_id: roleId,
        assigned_by: assignerId,
        assigned_at: new Date(),
      },
      create: {
        user_id: userId,
        org_id: orgId,
        role_id: roleId,
        assigned_by: assignerId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }
}
