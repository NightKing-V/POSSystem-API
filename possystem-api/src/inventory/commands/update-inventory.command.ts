import { ICommand } from '@nestjs/cqrs';
import { UpdateInventoryDto } from '../dto/update-inventory.dto';

export class UpdateInventoryCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateInventoryDto: UpdateInventoryDto,
  ) {}
}
