import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Logger } from '@nestjs/common';
import { DeleteOrgCommand } from './delete-org.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteOrgCommand)
export class DeleteOrgHandler implements ICommandHandler<DeleteOrgCommand> {
  private readonly logger = new Logger(DeleteOrgHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteOrgCommand) {
    const { id } = command;
    this.logger.log(`Executing atomic DeleteOrgCommand for orgId: ${id}`);

    const org = await this.prisma.org.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.loyaltyProgramConfig.deleteMany({
        where: { org_id: id },
      });
      await tx.userRole.deleteMany({
        where: { org_id: id },
      });
      await tx.org.delete({
        where: { id },
      });
    });

    this.logger.log(`Organization ${id} successfully deleted.`);
    return { success: true, message: `Organization ${id} deleted successfully.` };
  }
}
