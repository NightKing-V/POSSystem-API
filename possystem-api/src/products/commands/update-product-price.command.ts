import { ICommand } from '@nestjs/cqrs';
import { UpdateProductPriceDto } from '../dto/update-product-price.dto';

export class UpdateProductPriceCommand implements ICommand {
  constructor(
    public readonly priceId: string,
    public readonly updatePriceDto: UpdateProductPriceDto,
  ) {}
}
