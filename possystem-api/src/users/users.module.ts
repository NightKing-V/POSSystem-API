import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserCommandHandlers } from './commands';
import { UserQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService, ...UserCommandHandlers, ...UserQueryHandlers],
  exports: [UsersService, CqrsModule],
})
export class UsersModule {}
