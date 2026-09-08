import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserCommand } from './delete-user.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteUserCommand) {
    const { id } = command;
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

