import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteInventoryCommand } from './delete-inventory.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteInventoryCommand)
export class DeleteInventoryHandler implements ICommandHandler<DeleteInventoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteInventoryCommand) {
    const { id } = command;

    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stocks: true,
            transactions: true,
            pos: true,
            bills: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(
        `Inventory location with ID "${id}" not found`,
      );
    }

    if (
      location._count.stocks > 0 ||
      location._count.transactions > 0 ||
      location._count.pos > 0 ||
      location._count.bills > 0
    ) {
      throw new BadRequestException(
        `Cannot delete location with ID "${id}" because it is referenced in stocks, transactions, purchase orders, or bills.`,
      );
    }

    await this.prisma.userLocation.deleteMany({
      where: { location_id: id },
    });

    return this.prisma.inventoryLocation.delete({
      where: { id },
    });
  }
}
