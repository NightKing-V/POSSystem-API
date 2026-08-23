import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplierCommandHandlers } from './commands';
import { SupplierQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [SuppliersController],
  providers: [
    SuppliersService,
    ...SupplierCommandHandlers,
    ...SupplierQueryHandlers,
  ],
  exports: [SuppliersService, CqrsModule],
})
export class SuppliersModule {}
