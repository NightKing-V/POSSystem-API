import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.SUPABASE_JWT_SECRET || 'fallback_supabase_secret', // Your Supabase project JWT secret
    });
  }

  async validate(payload: any) {
    // Supabase stores the user's UUID in the "sub" claim
    return { userId: payload.sub, email: payload.email };
  }
}
