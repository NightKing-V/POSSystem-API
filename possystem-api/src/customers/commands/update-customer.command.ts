import { ICommand } from '@nestjs/cqrs';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

export class UpdateCustomerCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateCustomerDto: UpdateCustomerDto,
  ) {}
}
