import { CommandHandler, CommandBus, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserWorkflowCommand } from './delete-user-workflow.command';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { DeleteOrgCommand } from './delete-org.command';
import { DeleteUserCommand } from '../../users/commands/delete-user.command';

@CommandHandler(DeleteUserWorkflowCommand)
export class DeleteUserWorkflowHandler implements ICommandHandler<DeleteUserWorkflowCommand> {
  private readonly logger = new Logger(DeleteUserWorkflowHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: DeleteUserWorkflowCommand) {
    const { userId } = command;
    this.logger.log(
      `Executing non-atomic DeleteUserWorkflow for userId: ${userId}`,
    );

    // 1. Find all organizations owned by the user
    const ownedOrgs = await this.prisma.org.findMany({
      where: { owner_id: userId },
    });

    // 2. Loop through each organization and orchestrate cascading deletion via DeleteOrgCommand
    for (const org of ownedOrgs) {
      this.logger.log(`Executing DeleteOrgCommand for Org: ${org.id}`);
      await this.commandBus.execute(new DeleteOrgCommand(org.id));
    }

    // 3. Delete the user itself (and identity provider credentials) using the atomic User deletion command
    this.logger.log(`Executing DeleteUserCommand for userId: ${userId}`);
    await this.commandBus.execute(new DeleteUserCommand(userId));

    return {
      message: 'User and all nested service records deleted successfully.',
    };
  }
}
