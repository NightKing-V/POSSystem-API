import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret =
      configService.get<string>('SUPABASE_JWT_SECRET') ||
      process.env.SUPABASE_JWT_SECRET;
    const supabaseUrl =
      configService.get<string>('SUPABASE_URL') ||
      process.env.SUPABASE_URL ||
      'https://placeholder.supabase.co';

    if (jwtSecret) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: jwtSecret,
        algorithms: ['HS256', 'ES256', 'RS256'],
      });
    } else {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKeyProvider: passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
        }),
        algorithms: ['ES256', 'HS256', 'RS256'],
      });
    }
  }

  async validate(payload: any) {
    // Supabase stores the user's UUID in the "sub" claim
    return { userId: payload.sub, email: payload.email };
  }
}
