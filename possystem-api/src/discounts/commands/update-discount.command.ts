import { ICommand } from '@nestjs/cqrs';
import { UpdateDiscountDto } from '../dto/update-discount.dto';

export class UpdateDiscountCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateDiscountDto: UpdateDiscountDto,
  ) {}
}
