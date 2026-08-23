import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateInventoryCommand } from './commands/create-inventory.command';
import { UpdateInventoryCommand } from './commands/update-inventory.command';
import { DeleteInventoryCommand } from './commands/delete-inventory.command';
import { AssignUserLocationCommand } from './commands/assign-user-location.command';
import { UnassignUserLocationCommand } from './commands/unassign-user-location.command';
import { GetInventoriesQuery } from './queries/get-inventories.query';
import { GetInventoryQuery } from './queries/get-inventory.query';
import { GetLocationUsersQuery } from './queries/get-location-users.query';
import { GetUserLocationsQuery } from './queries/get-user-locations.query';

@Injectable()
export class InventoryService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createInventoryDto: CreateInventoryDto) {
    return this.commandBus.execute(
      new CreateInventoryCommand(createInventoryDto),
    );
  }

  async findAll(orgId?: string) {
    return this.queryBus.execute(new GetInventoriesQuery(orgId));
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetInventoryQuery(id));
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    return this.commandBus.execute(
      new UpdateInventoryCommand(id, updateInventoryDto),
    );
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteInventoryCommand(id));
  }

  async assignUser(locationId: string, userId: string, assignerId?: string) {
    return this.commandBus.execute(
      new AssignUserLocationCommand(locationId, userId, assignerId),
    );
  }

  async unassignUser(locationId: string, userId: string) {
    return this.commandBus.execute(
      new UnassignUserLocationCommand(locationId, userId),
    );
  }

  async listUsers(locationId: string) {
    return this.queryBus.execute(new GetLocationUsersQuery(locationId));
  }

  async listLocationsForUser(userId: string) {
    return this.queryBus.execute(new GetUserLocationsQuery(userId));
  }
}
