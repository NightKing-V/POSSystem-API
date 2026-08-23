import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyCommandHandlers } from './commands';
import { LoyaltyQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule],
  controllers: [LoyaltyController],
  providers: [
    LoyaltyService,
    ...LoyaltyCommandHandlers,
    ...LoyaltyQueryHandlers,
  ],
  exports: [LoyaltyService, CqrsModule],
})
export class LoyaltyModule {}
