import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { LoginCommand } from './commands/login.command';
import { ForgotPasswordCommand } from './commands/forgot-password.command';
import { ResetPasswordCommand } from './commands/reset-password.command';
import { RegisterUserCommand } from '../workflows/commands/registeruser.command';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {
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
      const redirectTo = process.env.SUPABASE_REDIRECT_URL?.trim() || undefined;
      this.logger.debug(
        `Triggering signup confirmation email for ${email}${redirectTo ? ` (redirectTo: ${redirectTo})` : ''}...`,
      );
      const { error: resendError } = await this.supabase.auth.resend({
        type: 'signup',
        email,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
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

  async forgotPassword(email: string) {
    return this.commandBus.execute(new ForgotPasswordCommand(email));
  }

  async resetPassword(accessToken: string, newPassword: string) {
    return this.commandBus.execute(
      new ResetPasswordCommand(accessToken, newPassword),
    );
  }

  private getOtpSentAt(user: User | null, otpType: string): string | undefined {
    if (!user) return undefined;
    switch (otpType) {
      case 'recovery':
        return user.recovery_sent_at;
      case 'email_change':
        return user.email_change_sent_at;
      case 'invite':
        return user.invited_at || user.confirmation_sent_at;
      case 'signup':
      case 'email':
      case 'magiclink':
      default:
        return user.confirmation_sent_at;
    }
  }

  private isOtpExpiredForUser(
    user: User | null,
    otpType: string,
    otpExpiryMs: number,
  ): boolean {
    if (!user) return false;

    const sentAt = this.getOtpSentAt(user, otpType);
    if (!sentAt) {
      return true;
    }

    const sentAtMs = new Date(sentAt).getTime();
    if (Number.isNaN(sentAtMs)) {
      return false;
    }

    // Check if the OTP age exceeds the configured expiration window
    if (Date.now() - sentAtMs > otpExpiryMs) {
      return true;
    }

    // For signup OTPs, if the email was already confirmed at or after confirmation_sent_at,
    // the signup OTP has already been consumed/expired
    if (otpType === 'signup' && user.email_confirmed_at) {
      const confirmedAtMs = new Date(user.email_confirmed_at).getTime();
      if (!Number.isNaN(confirmedAtMs) && confirmedAtMs >= sentAtMs) {
        return true;
      }
    }

    return false;
  }

  async verifyRegistrationOtp(dto: { email: string; token: string; type?: any }) {
    const otpType = dto.type || 'signup';
    const otpExpirySeconds =
      Number(process.env.SUPABASE_OTP_EXPIRY_SECONDS) || 3600;
    const otpExpiryMs = otpExpirySeconds * 1000;

    this.logger.debug(
      `Verifying OTP for email: ${dto.email} with type: ${otpType}`,
    );

    // 1. Resolve Supabase user metadata to check OTP expiration timestamp
    let supabaseUser: User | null = null;
    try {
      const localUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (localUser) {
        const { data: adminData } =
          await this.supabase.auth.admin.getUserById(localUser.id);
        supabaseUser = adminData?.user ?? null;
      }
    } catch (lookupErr) {
      this.logger.warn(
        `Could not pre-fetch user OTP metadata for ${dto.email}: ${lookupErr.message}`,
      );
    }

    // 2. If OTP is already expired based on sent_at timestamp, reject immediately with OTP_EXPIRED
    if (
      supabaseUser &&
      this.isOtpExpiredForUser(supabaseUser, otpType, otpExpiryMs)
    ) {
      this.logger.warn(`OTP expired for ${dto.email} (type: ${otpType})`);
      throw new BadRequestException({
        statusCode: 400,
        code: 'OTP_EXPIRED',
        error: 'OTP Expired',
        message: 'OTP has expired. Please request a new code.',
      });
    }

    // 3. Verify the OTP token against Supabase Auth
    const { data, error } = await this.supabase.auth.verifyOtp({
      email: dto.email,
      token: dto.token,
      type: otpType as any,
    });

    if (error) {
      this.logger.error(
        `OTP verification failed for ${dto.email}: ${error.message}`,
      );

      // Re-check expiration in case it expired right at the boundary;
      // otherwise, since the OTP is still within its validity window, the code entered is invalid.
      const expired =
        supabaseUser &&
        this.isOtpExpiredForUser(supabaseUser, otpType, otpExpiryMs);

      if (expired) {
        throw new BadRequestException({
          statusCode: 400,
          code: 'OTP_EXPIRED',
          error: 'OTP Expired',
          message: 'OTP has expired. Please request a new code.',
        });
      }

      throw new BadRequestException({
        statusCode: 400,
        code: 'OTP_INVALID',
        error: 'Invalid OTP',
        message: 'Invalid OTP code. Please check the code and try again.',
      });
    }

    this.logger.log(`OTP successfully verified for ${dto.email}`);
    return {
      message: 'OTP successfully verified.',
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
