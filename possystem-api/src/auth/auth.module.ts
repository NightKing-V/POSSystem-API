import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthCommandHandlers } from './commands';

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, ...AuthCommandHandlers],
  exports: [PassportModule, JwtStrategy, AuthService, CqrsModule],
})
export class AuthModule {}
