import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { DeleteBillCommand } from './commands/delete-bill.command';
import { GetBillsQuery } from './queries/get-bills.query';
import { GetBillQuery } from './queries/get-bill.query';
import { CreateBillCommand } from '../workflows/commands/create-bill.command';
import { CancelBillCommand } from '../workflows/commands/cancel-bill.command';

@Injectable()
export class BillsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createBillDto: CreateBillDto) {
    return this.commandBus.execute(new CreateBillCommand(createBillDto));
  }

  async findAll(orgId?: string, locationId?: string, customerId?: string) {
    return this.queryBus.execute(
      new GetBillsQuery(orgId, locationId, customerId),
    );
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetBillQuery(id));
  }

  async update(id: string, updateBillDto: UpdateBillDto) {
    return this.commandBus.execute(new CancelBillCommand(id, updateBillDto));
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteBillCommand(id));
  }
}
