import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { CreateUserCommand } from './create-user.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateUserCommand) {
    const { createUserDto } = command;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        id: createUserDto.id || undefined,
        email: createUserDto.email,
        fullname: createUserDto.fullname,
        phone: createUserDto.phone || undefined,
        address: createUserDto.address || undefined,
      },
    });
  }
}
