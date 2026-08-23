import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteSupplierCommand } from './delete-supplier.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteSupplierCommand)
export class DeleteSupplierHandler implements ICommandHandler<DeleteSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteSupplierCommand) {
    const { id } = command;

    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, batches: true, purchase_orders: true },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    if (supplier._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete supplier with ID "${id}" because they are linked to ${supplier._count.products} products.`,
      );
    }

    if (supplier._count.batches > 0) {
      throw new BadRequestException(
        `Cannot delete supplier with ID "${id}" because they are linked to ${supplier._count.batches} stock batches.`,
      );
    }

    if (supplier._count.purchase_orders > 0) {
      throw new BadRequestException(
        `Cannot delete supplier with ID "${id}" because they are linked to ${supplier._count.purchase_orders} purchase orders.`,
      );
    }

    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
