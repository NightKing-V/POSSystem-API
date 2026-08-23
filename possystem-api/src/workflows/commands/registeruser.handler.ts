import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { RegisterUserCommand } from './registeruser.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { email, password, fullname, phone } = command;

    // 1. Register the user in Supabase auth provider
    const authData = await this.authService.signUpSupabase(email, password);
    if (!authData || !authData.user) {
      throw new BadRequestException('User registration failed in Auth provider');
    }

    const userId = authData.user.id;

    // 2. Create the user profile in Postgres
    await this.prisma.user.create({
      data: {
        id: userId,
        email,
        fullname: fullname || email.split('@')[0],
        phone: phone || null,
      },
    });

    return authData;
  }
}
