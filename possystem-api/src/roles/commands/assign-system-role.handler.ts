import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AssignSystemRoleCommand } from './assign-system-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(AssignSystemRoleCommand)
export class AssignSystemRoleHandler
  implements ICommandHandler<AssignSystemRoleCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AssignSystemRoleCommand) {
    const { userId, roleId, assignerId } = command;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const role = await this.prisma.systemRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`System role with ID "${roleId}" not found`);
    }

    if (role.is_org_template) {
      throw new BadRequestException(
        `System role "${role.name}" is an organization role template and cannot be assigned directly as a platform-level system role. Assign the organization's corresponding OrgRole via /roles/org/assign/:orgId/:userId instead.`,
      );
    }

    const existing = await this.prisma.userSystemRole.findUnique({
      where: {
        user_id_system_role_id: {
          user_id: userId,
          system_role_id: roleId,
        },
      },
      include: {
        system_role: {
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

    if (existing) {
      return existing;
    }

    return this.prisma.userSystemRole.create({
      data: {
        user_id: userId,
        system_role_id: roleId,
        assigned_by: assignerId,
      },
      include: {
        system_role: {
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
