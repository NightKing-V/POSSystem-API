import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteDiscountCommand } from './delete-discount.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteDiscountCommand)
export class DeleteDiscountHandler implements ICommandHandler<DeleteDiscountCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteDiscountCommand) {
    const { id } = command;

    const discount = await this.prisma.discount.findFirst({
      where: {
        OR: [{ id }, { coup_code: id }],
      },
    });

    if (!discount) {
      throw new NotFoundException(
        `Discount/Coupon with ID or code "${id}" not found`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.productDiscount.deleteMany({
        where: { discount_id: discount.id },
      });
      await tx.categoryDiscount.deleteMany({
        where: { discount_id: discount.id },
      });

      return tx.discount.delete({
        where: { id: discount.id },
      });
    });
  }
}
