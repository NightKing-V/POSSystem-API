import { ICommand } from '@nestjs/cqrs';
import { CreateCategoryDto } from '../dto/create-category.dto';

export class CreateCategoryCommand implements ICommand {
  constructor(public readonly createCategoryDto: CreateCategoryDto) {}
}
