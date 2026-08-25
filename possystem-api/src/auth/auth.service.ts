import {
  Injectable,
  BadRequestException,
  Logger,
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
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly commandBus: CommandBus) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    this.logger.debug(`Initializing Supabase client with URL: ${supabaseUrl}`);
    
    this.supabase = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseServiceKey || 'placeholder',
    );
  }

  async signUpSupabase(email: string, password: string) {
    this.logger.debug(`Calling Supabase auth.admin.createUser for email: ${email}`);
    try {
      // 1. Create the user directly via Admin API
      const { data, error } = await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // User must verify
      });

      if (error) {
        this.logger.error(`Supabase admin.createUser error for ${email}: ${error.message}`);
        // Handle existing email explicitly
        if (
          error.message.includes('already registered') || 
          error.message.includes('already exists') || 
          (error as any).code === 'email_exists'
        ) {
          throw new BadRequestException('An account with this email already exists.');
        }
        throw new BadRequestException(error.message);
      }

      // 2. Trigger the signup confirmation OTP email
      this.logger.debug(`Triggering signup confirmation email for ${email}...`);
      const { error: resendError } = await this.supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (resendError) {
        this.logger.warn(`Failed to send confirmation email for ${email}: ${resendError.message}`);
      }

      this.logger.debug(`Supabase createUser complete for ${email}. Result user ID: ${data?.user?.id}`);
      return data;
    } catch (err) {
      this.logger.error(`Error during Supabase signUp for ${email}: ${err.message}`, err.stack);
      throw err;
    }
  }

  async isEmailConfirmed(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);
    if (error) {
      this.logger.error(`Failed to retrieve user status for ID ${userId}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data.user?.email_confirmed_at !== null;
  }

  async register(
    email: string,
    password: string,
    fullname?: string,
    phone?: string,
  ) {
    this.logger.log(`AuthService.register called for: ${email}`);
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

  async verifyRegistrationOtp(dto: { email: string; token: string }) {
    this.logger.debug(`Verifying signup OTP for email: ${dto.email}`);
    const { data, error } = await this.supabase.auth.verifyOtp({
      email: dto.email,
      token: dto.token,
      type: 'signup',
    });

    if (error) {
      this.logger.error(`OTP verification failed for ${dto.email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    this.logger.log(`OTP successfully verified for ${dto.email}`);
    return {
      message: 'Email successfully verified.',
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    };
  }

  async deleteUserSupabase(userId: string) {
    this.logger.debug(`Deleting user ${userId} from Supabase Auth...`);
    const { error } = await this.supabase.auth.admin.deleteUser(userId);
    if (error) {
      this.logger.error(`Failed to delete user ${userId} from Supabase: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    this.logger.log(`User ${userId} successfully deleted from Supabase Auth.`);
  }
}
