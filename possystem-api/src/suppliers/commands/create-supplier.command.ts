import { ICommand } from '@nestjs/cqrs';
import { CreateSupplierDto } from '../dto/create-supplier.dto';

export class CreateSupplierCommand implements ICommand {
  constructor(public readonly createSupplierDto: CreateSupplierDto) {}
}
