import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerCommand } from './commands/create-customer.command';
import { UpdateCustomerCommand } from './commands/update-customer.command';
import { DeleteCustomerCommand } from './commands/delete-customer.command';
import { GetCustomersQuery } from './queries/get-customers.query';
import { GetCustomerQuery } from './queries/get-customer.query';

@Injectable()
export class CustomersService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    return this.commandBus.execute(
      new CreateCustomerCommand(createCustomerDto),
    );
  }

  async findAll(orgId?: string) {
    return this.queryBus.execute(new GetCustomersQuery(orgId));
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetCustomerQuery(id));
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    return this.commandBus.execute(
      new UpdateCustomerCommand(id, updateCustomerDto),
    );
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteCustomerCommand(id));
  }
}
