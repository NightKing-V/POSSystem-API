import { ICommand } from '@nestjs/cqrs';
import { UpdateLoyaltyDto } from '../dto/update-loyalty.dto';

export class UpdateLoyaltyCommand implements ICommand {
  constructor(
    public readonly id: number,
    public readonly updateLoyaltyDto: UpdateLoyaltyDto,
  ) {}
}
