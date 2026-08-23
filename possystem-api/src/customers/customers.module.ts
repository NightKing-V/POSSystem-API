import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerCommandHandlers } from './commands';
import { CustomerQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    ...CustomerCommandHandlers,
    ...CustomerQueryHandlers,
  ],
  exports: [CustomersService, CqrsModule],
})
export class CustomersModule {}
