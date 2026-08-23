import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ResetPasswordCommand } from './reset-password.command';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  async execute(command: ResetPasswordCommand) {
    const { accessToken, newPassword } = command;

    const tempSupabase = createClient(
      process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'placeholder',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );

    const { data, error } = await tempSupabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
