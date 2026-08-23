import { ICommand } from '@nestjs/cqrs';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';

export class CreatePurchaseOrderCommand implements ICommand {
  constructor(public readonly createPurchaseOrderDto: CreatePurchaseOrderDto) {}
}
