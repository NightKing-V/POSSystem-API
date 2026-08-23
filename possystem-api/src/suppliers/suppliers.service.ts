import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierCommand } from './commands/create-supplier.command';
import { UpdateSupplierCommand } from './commands/update-supplier.command';
import { DeleteSupplierCommand } from './commands/delete-supplier.command';
import { GetSuppliersQuery } from './queries/get-suppliers.query';
import { GetSupplierQuery } from './queries/get-supplier.query';
import { GetSupplierProductsQuery } from './queries/get-supplier-products.query';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createSupplierDto: CreateSupplierDto) {
    return this.commandBus.execute(
      new CreateSupplierCommand(createSupplierDto),
    );
  }

  async findAll(orgId?: string) {
    return this.queryBus.execute(new GetSuppliersQuery(orgId));
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetSupplierQuery(id));
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    return this.commandBus.execute(
      new UpdateSupplierCommand(id, updateSupplierDto),
    );
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteSupplierCommand(id));
  }

  async findProducts(id: string) {
    return this.queryBus.execute(new GetSupplierProductsQuery(id));
  }
}
