import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeleteRoleCommand } from './delete-role.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteRoleCommand) {
    const { id } = command;
    const role = await this.prisma.orgRole.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    if (role.is_entrypoint || role.is_builtin) {
      throw new BadRequestException(
        `Cannot delete built-in or entrypoint organization role "${role.name}"`,
      );
    }

    await this.prisma.orgRolePermission.deleteMany({
      where: { org_role_id: id },
    });

    await this.prisma.userRole.deleteMany({
      where: { role_id: id },
    });

    return this.prisma.orgRole.delete({
      where: { id },
    });
  }
}
