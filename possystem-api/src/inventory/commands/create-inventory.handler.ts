import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CreateInventoryCommand } from './create-inventory.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateInventoryCommand)
export class CreateInventoryHandler implements ICommandHandler<CreateInventoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateInventoryCommand) {
    const { createInventoryDto } = command;

    const org = await this.prisma.org.findUnique({
      where: { id: createInventoryDto.org_id },
    });
    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${createInventoryDto.org_id}" not found`,
      );
    }

    return this.prisma.inventoryLocation.create({
      data: {
        org_id: createInventoryDto.org_id,
        name: createInventoryDto.name,
        type: createInventoryDto.type,
        address: createInventoryDto.address || null,
        phone: createInventoryDto.phone || null,
        is_active:
          createInventoryDto.is_active !== undefined
            ? createInventoryDto.is_active
            : true,
      },
    });
  }
}
