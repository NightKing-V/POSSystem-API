import { ICommand } from '@nestjs/cqrs';
import { UpdateOrgDto } from '../dto/update-org.dto';

export class UpdateOrgCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateOrgDto: UpdateOrgDto,
  ) {}
}
