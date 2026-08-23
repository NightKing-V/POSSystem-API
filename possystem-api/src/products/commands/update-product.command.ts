import { ICommand } from '@nestjs/cqrs';
import { UpdateProductDto } from '../dto/update-product.dto';

export class UpdateProductCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateProductDto: UpdateProductDto,
  ) {}
}
