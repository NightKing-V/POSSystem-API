import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminCommandHandlers } from './commands';
import { AdminQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, ...AdminCommandHandlers, ...AdminQueryHandlers],
  exports: [AdminService],
})
export class AdminModule {}
