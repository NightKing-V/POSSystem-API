import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleCommandHandlers } from './commands';
import { RoleQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [RolesController],
  providers: [RolesService, ...RoleCommandHandlers, ...RoleQueryHandlers],
  exports: [RolesService, CqrsModule],
})
export class RolesModule {}
