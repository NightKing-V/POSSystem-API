import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductCommandHandlers } from './commands';
import { ProductQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, ...ProductCommandHandlers, ...ProductQueryHandlers],
  exports: [ProductsService, CqrsModule],
})
export class ProductsModule {}
