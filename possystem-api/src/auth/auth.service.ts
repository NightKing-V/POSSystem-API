import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LoginCommand } from './commands/login.command';
import { ForgotPasswordCommand } from './commands/forgot-password.command';
import { ResetPasswordCommand } from './commands/reset-password.command';
import { RegisterUserCommand } from '../workflows/commands/registeruser.command';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private readonly commandBus: CommandBus) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'placeholder',
    );
  }

  async signUpSupabase(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async register(
    email: string,
    password: string,
    fullname?: string,
    phone?: string,
  ) {
    return this.commandBus.execute(
      new RegisterUserCommand(email, password, fullname, phone),
    );
  }

  async login(email: string, password: string) {
    return this.commandBus.execute(new LoginCommand(email, password));
  }

  async forgotPassword(email: string, redirectTo?: string) {
    return this.commandBus.execute(
      new ForgotPasswordCommand(email, redirectTo),
    );
  }

  async resetPassword(accessToken: string, newPassword: string) {
    return this.commandBus.execute(
      new ResetPasswordCommand(accessToken, newPassword),
    );
  }
}
