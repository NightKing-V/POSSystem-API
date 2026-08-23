import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryCommandHandlers } from './commands';
import { InventoryQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    ...InventoryCommandHandlers,
    ...InventoryQueryHandlers,
  ],
  exports: [InventoryService, CqrsModule],
})
export class InventoryModule {}
