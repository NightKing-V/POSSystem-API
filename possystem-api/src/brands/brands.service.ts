import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateBrandCommand } from './commands/create-brand.command';
import { UpdateBrandCommand } from './commands/update-brand.command';
import { DeleteBrandCommand } from './commands/delete-brand.command';
import { GetBrandsQuery } from './queries/get-brands.query';
import { GetBrandQuery } from './queries/get-brand.query';

@Injectable()
export class BrandsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    return this.commandBus.execute(new CreateBrandCommand(createBrandDto));
  }

  async findAll(orgId?: string) {
    return this.queryBus.execute(new GetBrandsQuery(orgId));
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetBrandQuery(id));
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    return this.commandBus.execute(new UpdateBrandCommand(id, updateBrandDto));
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteBrandCommand(id));
  }
}
