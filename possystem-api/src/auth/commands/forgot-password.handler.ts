import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ForgotPasswordCommand } from './forgot-password.command';

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand> {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'placeholder',
    );
  }

  async execute(command: ForgotPasswordCommand) {
    const { email } = command;
    const redirectTo = process.env.SUPABASE_REDIRECT_URL?.trim() || undefined;
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo,
      },
    );
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
