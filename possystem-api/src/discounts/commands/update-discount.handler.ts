import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateDiscountCommand } from './update-discount.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateDiscountCommand)
export class UpdateDiscountHandler implements ICommandHandler<UpdateDiscountCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateDiscountCommand) {
    const { id, updateDiscountDto } = command;

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

    if (
      updateDiscountDto.coup_code &&
      updateDiscountDto.coup_code !== discount.coup_code
    ) {
      const existing = await this.prisma.discount.findUnique({
        where: {
          org_id_coup_code: {
            org_id: discount.org_id,
            coup_code: updateDiscountDto.coup_code,
          },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Discount coupon code "${updateDiscountDto.coup_code}" already exists in this organization`,
        );
      }
    }

    const finalScope = updateDiscountDto.scope || discount.scope;

    if (
      finalScope === 'PRODUCT' &&
      updateDiscountDto.product_ids &&
      updateDiscountDto.product_ids.length > 0
    ) {
      const validProducts = await this.prisma.product.count({
        where: {
          id: { in: updateDiscountDto.product_ids },
          org_id: discount.org_id,
        },
      });
      if (validProducts !== updateDiscountDto.product_ids.length) {
        throw new BadRequestException(
          'One or more specified product_ids do not exist or do not belong to this organization',
        );
      }
    }

    if (
      finalScope === 'CATEGORY' &&
      updateDiscountDto.category_ids &&
      updateDiscountDto.category_ids.length > 0
    ) {
      const validCategories = await this.prisma.productCategory.count({
        where: {
          id: { in: updateDiscountDto.category_ids },
          org_id: discount.org_id,
        },
      });
      if (validCategories !== updateDiscountDto.category_ids.length) {
        throw new BadRequestException(
          'One or more specified category_ids do not exist or do not belong to this organization',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.discount.update({
        where: { id: discount.id },
        data: {
          name: updateDiscountDto.name,
          type: updateDiscountDto.type,
          value: updateDiscountDto.value,
          valid_from: updateDiscountDto.valid_from
            ? new Date(updateDiscountDto.valid_from)
            : undefined,
          valid_to:
            updateDiscountDto.valid_to !== undefined
              ? updateDiscountDto.valid_to
                ? new Date(updateDiscountDto.valid_to)
                : null
              : undefined,
          min_qty:
            updateDiscountDto.min_qty !== undefined
              ? updateDiscountDto.min_qty
              : undefined,
          min_val:
            updateDiscountDto.min_val !== undefined
              ? updateDiscountDto.min_val
              : undefined,
          coup_code:
            updateDiscountDto.coup_code !== undefined
              ? updateDiscountDto.coup_code
              : undefined,
          is_active:
            updateDiscountDto.is_active !== undefined
              ? updateDiscountDto.is_active
              : undefined,
          is_stackable:
            updateDiscountDto.is_stackable !== undefined
              ? updateDiscountDto.is_stackable
              : undefined,
          scope: updateDiscountDto.scope,
        },
      });

      if (updateDiscountDto.product_ids !== undefined) {
        await tx.productDiscount.deleteMany({
          where: { discount_id: discount.id },
        });
        if (
          finalScope === 'PRODUCT' &&
          updateDiscountDto.product_ids.length > 0
        ) {
          await tx.productDiscount.createMany({
            data: updateDiscountDto.product_ids.map((pId) => ({
              product_id: pId,
              discount_id: discount.id,
            })),
          });
        }
      }

      if (updateDiscountDto.category_ids !== undefined) {
        await tx.categoryDiscount.deleteMany({
          where: { discount_id: discount.id },
        });
        if (
          finalScope === 'CATEGORY' &&
          updateDiscountDto.category_ids.length > 0
        ) {
          await tx.categoryDiscount.createMany({
            data: updateDiscountDto.category_ids.map((cId) => ({
              category_id: cId,
              discount_id: discount.id,
            })),
          });
        }
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
