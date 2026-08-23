import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteOrgCommand } from './delete-org.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteOrgCommand)
export class DeleteOrgHandler implements ICommandHandler<DeleteOrgCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteOrgCommand) {
    const { id } = command;

    const org = await this.prisma.org.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    await this.prisma.userRole.deleteMany({
      where: { org_id: id },
    });

    return this.prisma.org.delete({
      where: { id },
    });
  }
}
