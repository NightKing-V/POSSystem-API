import { ICommand } from '@nestjs/cqrs';
import { CreateProductPriceDto } from '../dto/create-product-price.dto';

export class CreateProductPriceCommand implements ICommand {
  constructor(
    public readonly productId: string,
    public readonly createPriceDto: CreateProductPriceDto,
  ) {}
}
