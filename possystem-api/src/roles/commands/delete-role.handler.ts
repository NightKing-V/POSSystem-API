import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteRoleCommand } from './delete-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteRoleCommand) {
    const { id } = command;
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    await this.prisma.rolePermission.deleteMany({
      where: { role_id: id },
    });

    await this.prisma.userRole.deleteMany({
      where: { role_id: id },
    });

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
