import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryCommand } from './commands/create-category.command';
import { UpdateCategoryCommand } from './commands/update-category.command';
import { DeleteCategoryCommand } from './commands/delete-category.command';
import { GetCategoriesQuery } from './queries/get-categories.query';
import { GetCategoryQuery } from './queries/get-category.query';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.commandBus.execute(
      new CreateCategoryCommand(createCategoryDto),
    );
  }

  async findAll() {
    return this.queryBus.execute(new GetCategoriesQuery());
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetCategoryQuery(id));
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.commandBus.execute(
      new UpdateCategoryCommand(id, updateCategoryDto),
    );
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteCategoryCommand(id));
  }
}
