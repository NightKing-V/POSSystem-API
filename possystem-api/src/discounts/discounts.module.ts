import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DiscountCommandHandlers } from './commands';
import { DiscountQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [DiscountsController],
  providers: [
    DiscountsService,
    ...DiscountCommandHandlers,
    ...DiscountQueryHandlers,
  ],
  exports: [DiscountsService, CqrsModule],
})
export class DiscountsModule {}
