import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Logger } from '@nestjs/common';
import { RegisterUserCommand } from './registeruser.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  private readonly logger = new Logger(RegisterUserHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { email, password, fullname, phone } = command;
    this.logger.log(`Attempting to register user with email: ${email}`);

    try {
      // 1. Register the user in Supabase auth provider using admin client
      this.logger.debug(`Registering user ${email} in Supabase auth...`);
      const authData = await this.authService.signUpSupabase(email, password);

      if (!authData || !authData.user) {
        throw new BadRequestException('Registration failed. Please try again.');
      }

      const userId = authData.user.id;
      this.logger.debug(`Supabase auth successful. User ID: ${userId}`);

      // 2. Create the user profile in Postgres
      this.logger.debug(
        `Creating profile for user ${email} (ID: ${userId}) in database...`,
      );
      const profile = await this.prisma.user.create({
        data: {
          id: userId,
          email,
          fullname: fullname || email.split('@')[0],
          phone: phone || null,
        },
      });
      this.logger.debug(
        `Database user profile created successfully: ${JSON.stringify(profile)}`,
      );

      // 3. Successful signup, waiting for OTP verification
      this.logger.log(
        `User registration successful. Pending email verification for ${email}`,
      );
      return {
        status: 'pending_verification',
        message: 'Registration successful. Please check your email to verify.',
      };
    } catch (error) {
      this.logger.error(
        `Registration failed for user ${email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
