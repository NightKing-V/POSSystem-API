import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ResetPasswordCommand } from './reset-password.command';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  private readonly logger = new Logger(ResetPasswordHandler.name);

  async execute(command: ResetPasswordCommand) {
    const { accessToken, newPassword } = command;
    this.logger.debug('Executing ResetPasswordCommand...');

    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        'placeholder',
    );

    // 1. Resolve user identity from access token
    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      this.logger.error(`Failed to get user from token: ${userError?.message}`);
      throw new BadRequestException(
        userError?.message || 'Invalid or expired reset token.',
      );
    }

    // 2. Update user password securely via Admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      {
        password: newPassword,
      },
    );

    if (error) {
      this.logger.error(
        `Failed to update password for user ${userData.user.id}: ${error.message}`,
      );
      throw new BadRequestException(error.message);
    }

    this.logger.log(
      `Password reset successfully for user: ${userData.user.email}`,
    );
    return {
      message: 'Password updated successfully.',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  }
}
