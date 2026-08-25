import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteInventoryCommand } from './delete-inventory.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteInventoryCommand)
export class DeleteInventoryHandler implements ICommandHandler<DeleteInventoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteInventoryCommand) {
    const { id, force } = command;

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

    if (!force) {
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
    }

    return this.prisma.$transaction(async (tx) => {
      if (force) {
        // Delete all stocks, transactions, and stock batches for this location
        await tx.inventoryStock.deleteMany({ where: { location_id: id } });
        await tx.inventoryTransaction.deleteMany({ where: { location_id: id } });
        await tx.stockBatch.deleteMany({ where: { received_at_location_id: id } });
      }

      await tx.userLocation.deleteMany({
        where: { location_id: id },
      });

      return tx.inventoryLocation.delete({
        where: { id },
      });
    });
  }
}
