import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoryCommandHandlers } from './commands';
import { CategoryQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    ...CategoryCommandHandlers,
    ...CategoryQueryHandlers,
  ],
  exports: [CategoriesService, CqrsModule],
})
export class CategoriesModule {}
