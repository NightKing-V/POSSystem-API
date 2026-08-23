import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BrandCommandHandlers } from './commands';
import { BrandQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [BrandsController],
  providers: [BrandsService, ...BrandCommandHandlers, ...BrandQueryHandlers],
  exports: [BrandsService, CqrsModule],
})
export class BrandsModule {}
