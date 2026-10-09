import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteSystemRoleCommand } from './delete-system-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteSystemRoleCommand)
export class DeleteSystemRoleHandler implements ICommandHandler<DeleteSystemRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteSystemRoleCommand) {
    const { id } = command;
    const role = await this.prisma.systemRole.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`System role with ID "${id}" not found`);
    }

    await this.prisma.systemRolePermission.deleteMany({
      where: { system_role_id: id },
    });

    await this.prisma.userSystemRole.deleteMany({
      where: { system_role_id: id },
    });

    return this.prisma.systemRole.delete({
      where: { id },
    });
  }
}

