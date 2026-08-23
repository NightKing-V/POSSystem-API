import { ICommand } from '@nestjs/cqrs';
import { UpdateBillDto } from '../../bills/dto/update-bill.dto';

export class CancelBillCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateBillDto: UpdateBillDto,
  ) {}
}
