import { ICommand } from '@nestjs/cqrs';
import { InviteMemberDto } from '../../orgs/dto/invite-member.dto';

export class InviteMemberCommand implements ICommand {
  constructor(
    public readonly orgId: string,
    public readonly inviteDto: InviteMemberDto,
    public readonly assignerId: string,
  ) {}
}
