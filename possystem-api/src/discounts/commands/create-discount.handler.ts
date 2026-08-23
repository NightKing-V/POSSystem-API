import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { CreateDiscountCommand } from './create-discount.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateDiscountCommand)
export class CreateDiscountHandler implements ICommandHandler<CreateDiscountCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateDiscountCommand) {
    const { createDiscountDto } = command;

    if (createDiscountDto.coup_code) {
      const existing = await this.prisma.discount.findUnique({
        where: { coup_code: createDiscountDto.coup_code },
      });
      if (existing) {
        throw new ConflictException(
          `Discount coupon code "${createDiscountDto.coup_code}" already exists`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
          name: createDiscountDto.name,
          type: createDiscountDto.type,
          value: createDiscountDto.value,
          valid_from: createDiscountDto.valid_from
            ? new Date(createDiscountDto.valid_from)
            : new Date(),
          valid_to: createDiscountDto.valid_to
            ? new Date(createDiscountDto.valid_to)
            : null,
          min_qty: createDiscountDto.min_qty || null,
          min_val: createDiscountDto.min_val || null,
          coup_code: createDiscountDto.coup_code || null,
          is_active: createDiscountDto.is_active ?? true,
          is_stackable: createDiscountDto.is_stackable ?? false,
          scope: createDiscountDto.scope,
        },
      });

      if (
        createDiscountDto.scope === 'PRODUCT' &&
        createDiscountDto.product_ids
      ) {
        await tx.productDiscount.createMany({
          data: createDiscountDto.product_ids.map((productId) => ({
            product_id: productId,
            discount_id: discount.id,
          })),
        });
      }

      if (
        createDiscountDto.scope === 'CATEGORY' &&
        createDiscountDto.category_ids
      ) {
        await tx.categoryDiscount.createMany({
          data: createDiscountDto.category_ids.map((categoryId) => ({
            category_id: categoryId,
            discount_id: discount.id,
          })),
        });
      }

      return tx.discount.findUnique({
        where: { id: discount.id },
        include: {
          product_discounts: true,
          category_discounts: true,
        },
      });
    });
  }
}
