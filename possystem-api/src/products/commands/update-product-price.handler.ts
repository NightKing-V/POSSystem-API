import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateProductPriceCommand } from './update-product-price.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateProductPriceCommand)
export class UpdateProductPriceHandler implements ICommandHandler<UpdateProductPriceCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateProductPriceCommand) {
    const { priceId, updatePriceDto } = command;

    const price = await this.prisma.productPrice.findUnique({
      where: { id: priceId },
    });
    if (!price) {
      throw new NotFoundException(
        `Product price with ID "${priceId}" not found`,
      );
    }

    const effectiveFrom = updatePriceDto.effectivefrom
      ? new Date(updatePriceDto.effectivefrom)
      : new Date(price.effectivefrom);
    let effectiveTo = price.effectiveto;
    if (updatePriceDto.effectiveto) {
      effectiveTo = new Date(updatePriceDto.effectiveto);
      if (effectiveTo <= effectiveFrom) {
        throw new BadRequestException(
          'effectivefrom date must be before effectiveto date',
        );
      }
    }

    const isDefault = updatePriceDto.isdefault;
    if (isDefault) {
      await this.prisma.productPrice.updateMany({
        where: { productid: price.productid },
        data: { isdefault: false },
      });
    }

    return this.prisma.productPrice.update({
      where: { id: priceId },
      data: {
        price: updatePriceDto.price,
        currency: updatePriceDto.currency,
        effectivefrom: updatePriceDto.effectivefrom ? effectiveFrom : undefined,
        effectiveto: updatePriceDto.effectiveto ? effectiveTo : undefined,
        isdefault: isDefault,
      },
    });
  }
}
