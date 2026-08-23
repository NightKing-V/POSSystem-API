import { ICommand } from '@nestjs/cqrs';
import { CreateProductDto } from '../dto/create-product.dto';

export class CreateProductCommand implements ICommand {
  constructor(public readonly createProductDto: CreateProductDto) {}
}
