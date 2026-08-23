import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrderCommandHandlers } from './commands';
import { PurchaseOrderQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule],
  controllers: [PurchaseOrdersController],
  providers: [
    PurchaseOrdersService,
    ...PurchaseOrderCommandHandlers,
    ...PurchaseOrderQueryHandlers,
  ],
  exports: [PurchaseOrdersService, CqrsModule],
})
export class PurchaseOrdersModule {}
