import { ICommand } from '@nestjs/cqrs';
import { CreateBillDto } from '../../bills/dto/create-bill.dto';

export class CreateBillCommand implements ICommand {
  constructor(public readonly createBillDto: CreateBillDto) {}
}
