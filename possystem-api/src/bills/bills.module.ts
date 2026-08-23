import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BillCommandHandlers } from './commands';
import { BillQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [BillsController],
  providers: [BillsService, ...BillCommandHandlers, ...BillQueryHandlers],
  exports: [BillsService, CqrsModule],
})
export class BillsModule {}
