import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { CreatePurchaseOrderCommand } from './commands/create-purchase-order.command';
import { UpdatePurchaseOrderCommand } from './commands/update-purchase-order.command';
import { DeletePurchaseOrderCommand } from './commands/delete-purchase-order.command';
import { GetPurchaseOrdersQuery } from './queries/get-purchase-orders.query';
import { GetPurchaseOrderQuery } from './queries/get-purchase-order.query';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createPurchaseOrderDto: CreatePurchaseOrderDto) {
    return this.commandBus.execute(
      new CreatePurchaseOrderCommand(createPurchaseOrderDto),
    );
  }

  async findAll() {
    return this.queryBus.execute(new GetPurchaseOrdersQuery());
  }

  async findOne(id: number) {
    return this.queryBus.execute(new GetPurchaseOrderQuery(id));
  }

  async update(id: number, updatePurchaseOrderDto: UpdatePurchaseOrderDto) {
    return this.commandBus.execute(
      new UpdatePurchaseOrderCommand(id, updatePurchaseOrderDto),
    );
  }

  async remove(id: number) {
    return this.commandBus.execute(new DeletePurchaseOrderCommand(id));
  }
}
