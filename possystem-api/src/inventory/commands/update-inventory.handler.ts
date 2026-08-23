import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UpdateInventoryCommand } from './update-inventory.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateInventoryCommand)
export class UpdateInventoryHandler implements ICommandHandler<UpdateInventoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateInventoryCommand) {
    const { id, updateInventoryDto } = command;

    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id },
    });
    if (!location) {
      throw new NotFoundException(
        `Inventory location with ID "${id}" not found`,
      );
    }

    return this.prisma.inventoryLocation.update({
      where: { id },
      data: {
        name: updateInventoryDto.name,
        type: updateInventoryDto.type,
        address: updateInventoryDto.address,
        phone: updateInventoryDto.phone,
        is_active: updateInventoryDto.is_active,
      },
    });
  }
}
