import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

import { RegisterUserHandler } from './commands/registeruser.handler';
import { CreateOrgHandler } from './commands/create-org.handler';
import { InviteMemberHandler } from './commands/invite-member.handler';
import { CreateBillHandler } from './commands/create-bill.handler';
import { CancelBillHandler } from './commands/cancel-bill.handler';
import { DeleteUserWorkflowHandler } from './commands/delete-user-workflow.handler';

const CommandHandlers = [
  RegisterUserHandler,
  CreateOrgHandler,
  InviteMemberHandler,
  CreateBillHandler,
  CancelBillHandler,
  DeleteUserWorkflowHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule, AuthModule, MailModule],
  providers: [...CommandHandlers],
  exports: [CqrsModule, ...CommandHandlers],
})
export class WorkflowsModule {}