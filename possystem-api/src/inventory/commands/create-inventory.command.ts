import { ICommand } from '@nestjs/cqrs';
import { CreateInventoryDto } from '../dto/create-inventory.dto';

export class CreateInventoryCommand implements ICommand {
  constructor(public readonly createInventoryDto: CreateInventoryDto) {}
}
