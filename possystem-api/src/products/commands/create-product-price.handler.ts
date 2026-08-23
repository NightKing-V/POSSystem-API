import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductPriceCommand } from './create-product-price.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateProductPriceCommand)
export class CreateProductPriceHandler implements ICommandHandler<CreateProductPriceCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateProductPriceCommand) {
    const { productId, createPriceDto } = command;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const effectiveFrom = createPriceDto.effectivefrom
      ? new Date(createPriceDto.effectivefrom)
      : new Date();
    let effectiveTo: Date | null = null;
    if (createPriceDto.effectiveto) {
      effectiveTo = new Date(createPriceDto.effectiveto);
      if (effectiveTo <= effectiveFrom) {
        throw new BadRequestException(
          'effectivefrom date must be before effectiveto date',
        );
      }
    }

    let isDefault = createPriceDto.isdefault || false;
    const existingPrices = await this.prisma.productPrice.findMany({
      where: { productid: productId },
    });

    if (existingPrices.length === 0) {
      isDefault = true;
    }

    if (isDefault) {
      await this.prisma.productPrice.updateMany({
        where: { productid: productId },
        data: { isdefault: false },
      });
    }

    return this.prisma.productPrice.create({
      data: {
        productid: productId,
        price: createPriceDto.price,
        currency: createPriceDto.currency || 'USD',
        effectivefrom: effectiveFrom,
        effectiveto: effectiveTo,
        isdefault: isDefault,
      },
    });
  }
}
