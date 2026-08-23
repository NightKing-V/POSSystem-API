import { ICommand } from '@nestjs/cqrs';
import { CreateCustomerDto } from '../dto/create-customer.dto';

export class CreateCustomerCommand implements ICommand {
  constructor(public readonly createCustomerDto: CreateCustomerDto) {}
}
