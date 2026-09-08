import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateOrgCommand } from './commands/update-org.command';
import { GetOrgsQuery } from './queries/get-orgs.query';
import { GetOrgQuery } from './queries/get-org.query';
import { GetBusinessCategoriesQuery } from './queries/get-business-categories.query';
import { CreateOrgCommand } from '../workflows/commands/create-org.command';
import { InviteMemberCommand } from '../workflows/commands/invite-member.command';
import { DeleteOrgCommand } from '../workflows/commands/delete-org.command';

@Injectable()
export class OrgsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createOrgDto: CreateOrgDto, ownerId: string) {
    return this.commandBus.execute(new CreateOrgCommand(createOrgDto, ownerId));
  }

  async findAll(userId?: string) {
    return this.queryBus.execute(new GetOrgsQuery(userId));
  }

  async findAllCategories() {
    return this.queryBus.execute(new GetBusinessCategoriesQuery());
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetOrgQuery(id));
  }

  async update(id: string, updateOrgDto: UpdateOrgDto) {
    return this.commandBus.execute(new UpdateOrgCommand(id, updateOrgDto));
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteOrgCommand(id));
  }

  async addMember(
    orgId: string,
    inviteDto: InviteMemberDto,
    assignerId: string,
  ) {
    return this.commandBus.execute(
      new InviteMemberCommand(orgId, inviteDto, assignerId),
    );
  }
}
