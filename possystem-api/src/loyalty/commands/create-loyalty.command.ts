import { ICommand } from '@nestjs/cqrs';
import { CreateLoyaltyDto } from '../dto/create-loyalty.dto';

export class CreateLoyaltyCommand implements ICommand {
  constructor(public readonly createLoyaltyDto: CreateLoyaltyDto) {}
}
