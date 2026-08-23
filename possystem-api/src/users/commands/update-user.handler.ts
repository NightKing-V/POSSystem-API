import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserCommand } from './update-user.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateUserCommand) {
    const { id, updateUserDto } = command;
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }
}
