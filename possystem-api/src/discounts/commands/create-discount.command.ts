import { ICommand } from '@nestjs/cqrs';
import { CreateDiscountDto } from '../dto/create-discount.dto';

export class CreateDiscountCommand implements ICommand {
  constructor(public readonly createDiscountDto: CreateDiscountDto) {}
}
