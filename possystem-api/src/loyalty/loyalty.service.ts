import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateLoyaltyDto } from './dto/create-loyalty.dto';
import { UpdateLoyaltyDto } from './dto/update-loyalty.dto';
import { CreateLoyaltyCommand } from './commands/create-loyalty.command';
import { UpdateLoyaltyCommand } from './commands/update-loyalty.command';
import { DeleteLoyaltyCommand } from './commands/delete-loyalty.command';
import { GetLoyaltiesQuery } from './queries/get-loyalties.query';
import { GetLoyaltyQuery } from './queries/get-loyalty.query';

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createLoyaltyDto: CreateLoyaltyDto) {
    return this.commandBus.execute(new CreateLoyaltyCommand(createLoyaltyDto));
  }

  async findAll() {
    return this.queryBus.execute(new GetLoyaltiesQuery());
  }

  async findOne(id: number) {
    return this.queryBus.execute(new GetLoyaltyQuery(id));
  }

  async update(id: number, updateLoyaltyDto: UpdateLoyaltyDto) {
    return this.commandBus.execute(
      new UpdateLoyaltyCommand(id, updateLoyaltyDto),
    );
  }

  async remove(id: number) {
    return this.commandBus.execute(new DeleteLoyaltyCommand(id));
  }
}
