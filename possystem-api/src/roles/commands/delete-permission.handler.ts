import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeletePermissionCommand } from './delete-permission.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeletePermissionCommand)
export class DeletePermissionHandler implements ICommandHandler<DeletePermissionCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeletePermissionCommand) {
    const { id } = command;
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) {
      throw new NotFoundException(`Permission with ID "${id}" not found`);
    }

    await this.prisma.rolePermission.deleteMany({
      where: { permission_id: id },
    });

    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
