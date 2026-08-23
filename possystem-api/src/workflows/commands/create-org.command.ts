import { ICommand } from '@nestjs/cqrs';
import { CreateOrgDto } from '../../orgs/dto/create-org.dto';

export class CreateOrgCommand implements ICommand {
  constructor(
    public readonly createOrgDto: CreateOrgDto,
    public readonly ownerId: string,
  ) {}
}
