import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

import * as jwt from 'jsonwebtoken';

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

    const jwksProvider = passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (req, rawJwtToken, done) => {
        try {
          const decoded = jwt.decode(rawJwtToken, { complete: true });
          if (
            decoded &&
            decoded.header &&
            (decoded.header.alg === 'ES256' ||
              decoded.header.alg === 'RS256' ||
              decoded.header.kid)
          ) {
            return jwksProvider(req, rawJwtToken, done);
          }
        } catch {
          // Fallback to static secret if decode fails
        }
        return done(null, jwtSecret);
      },
      algorithms: ['ES256', 'RS256', 'HS256'],
    });
  }

  validate(payload: any) {
    // Supabase stores the user's UUID in the "sub" claim
    return { userId: payload.sub, email: payload.email };
  }
}
