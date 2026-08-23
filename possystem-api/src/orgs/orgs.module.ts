import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OrgsService } from './orgs.service';
import { OrgsController } from './orgs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { OrgCommandHandlers } from './commands';
import { OrgQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule, AuthModule, MailModule],
  controllers: [OrgsController],
  providers: [OrgsService, ...OrgCommandHandlers, ...OrgQueryHandlers],
  exports: [OrgsService, CqrsModule],
})
export class OrgsModule {}
