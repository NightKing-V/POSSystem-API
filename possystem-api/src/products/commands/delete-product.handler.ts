import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteProductCommand } from './delete-product.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteProductCommand) {
    const { id } = command;

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stock_batches: true,
            po_items: true,
            bill_items: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (
      product._count.stock_batches > 0 ||
      product._count.po_items > 0 ||
      product._count.bill_items > 0
    ) {
      throw new BadRequestException(
        `Cannot delete product with ID "${id}" because it is referenced in stock batches, purchase orders, or bills.`,
      );
    }

    await this.prisma.productPrice.deleteMany({
      where: { productid: id },
    });

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
