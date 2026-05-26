import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.SUPABASE_ANON_KEY || 'placeholder'
        );
    }

    async register(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async login(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw new UnauthorizedException(error.message);
        return data;
    }

    async forgotPassword(email: string, redirectTo?: string) {
        const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo || undefined,
        });
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async resetPassword(accessToken: string, newPassword: string) {
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
            }
        );

        const { data, error } = await tempSupabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw new BadRequestException(error.message);
        return data;
    }
}