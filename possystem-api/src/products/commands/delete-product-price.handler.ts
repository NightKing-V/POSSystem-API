import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteProductPriceCommand } from './delete-product-price.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteProductPriceCommand)
export class DeleteProductPriceHandler implements ICommandHandler<DeleteProductPriceCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteProductPriceCommand) {
    const { priceId } = command;

    const price = await this.prisma.productPrice.findUnique({
      where: { id: priceId },
    });
    if (!price) {
      throw new NotFoundException(
        `Product price with ID "${priceId}" not found`,
      );
    }

    if (price.isdefault) {
      const otherPricesCount = await this.prisma.productPrice.count({
        where: {
          productid: price.productid,
          id: { not: priceId },
        },
      });

      if (otherPricesCount > 0) {
        throw new BadRequestException(
          'Cannot delete default price when other prices exist. Please set another price as default first.',
        );
      }
    }

    return this.prisma.productPrice.delete({
      where: { id: priceId },
    });
  }
}
