import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CouponItemDto } from './dto/validate-coupon.dto';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  async create(createDiscountDto: CreateDiscountDto) {
    // Check coupon code uniqueness
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
      // 1. Create the base Discount
      const discount = await tx.discount.create({
        data: {
          name: createDiscountDto.name,
          type: createDiscountDto.type,
          value: createDiscountDto.value,
          valid_from: createDiscountDto.valid_from ? new Date(createDiscountDto.valid_from) : new Date(),
          valid_to: createDiscountDto.valid_to ? new Date(createDiscountDto.valid_to) : null,
          min_qty: createDiscountDto.min_qty || null,
          min_val: createDiscountDto.min_val || null,
          coup_code: createDiscountDto.coup_code || null,
          is_active: createDiscountDto.is_active ?? true,
          is_stackable: createDiscountDto.is_stackable ?? false,
          scope: createDiscountDto.scope,
        },
      });

      // 2. Associate with products if PRODUCT scope
      if (createDiscountDto.scope === 'PRODUCT' && createDiscountDto.product_ids) {
        await tx.productDiscount.createMany({
          data: createDiscountDto.product_ids.map((productId) => ({
            product_id: productId,
            discount_id: discount.id,
          })),
        });
      }

      // 3. Associate with categories if CATEGORY scope
      if (createDiscountDto.scope === 'CATEGORY' && createDiscountDto.category_ids) {
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

  async findAll() {
    return this.prisma.discount.findMany({
      include: {
        product_discounts: {
          include: { product: true },
        },
        category_discounts: {
          include: { category: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const discount = await this.prisma.discount.findFirst({
      where: {
        OR: [{ id: id }, { coup_code: id }],
      },
      include: {
        product_discounts: {
          include: { product: true },
        },
        category_discounts: {
          include: { category: true },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException(`Discount/Coupon with ID or code "${id}" not found`);
    }

    return discount;
  }

  async update(id: string, updateDiscountDto: UpdateDiscountDto) {
    const discount = await this.findOne(id);

    if (updateDiscountDto.coup_code && updateDiscountDto.coup_code !== discount.coup_code) {
      const existing = await this.prisma.discount.findUnique({
        where: { coup_code: updateDiscountDto.coup_code },
      });
      if (existing) {
        throw new ConflictException(
          `Discount coupon code "${updateDiscountDto.coup_code}" already exists`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update Discount record
      await tx.discount.update({
        where: { id: discount.id },
        data: {
          name: updateDiscountDto.name,
          type: updateDiscountDto.type,
          value: updateDiscountDto.value,
          valid_from: updateDiscountDto.valid_from ? new Date(updateDiscountDto.valid_from) : undefined,
          valid_to: updateDiscountDto.valid_to !== undefined ? (updateDiscountDto.valid_to ? new Date(updateDiscountDto.valid_to) : null) : undefined,
          min_qty: updateDiscountDto.min_qty !== undefined ? updateDiscountDto.min_qty : undefined,
          min_val: updateDiscountDto.min_val !== undefined ? updateDiscountDto.min_val : undefined,
          coup_code: updateDiscountDto.coup_code !== undefined ? updateDiscountDto.coup_code : undefined,
          is_active: updateDiscountDto.is_active !== undefined ? updateDiscountDto.is_active : undefined,
          is_stackable: updateDiscountDto.is_stackable !== undefined ? updateDiscountDto.is_stackable : undefined,
          scope: updateDiscountDto.scope,
        },
      });

      const finalScope = updateDiscountDto.scope || discount.scope;

      // Handle product list updates
      if (updateDiscountDto.product_ids !== undefined) {
        await tx.productDiscount.deleteMany({ where: { discount_id: discount.id } });
        if (finalScope === 'PRODUCT' && updateDiscountDto.product_ids.length > 0) {
          await tx.productDiscount.createMany({
            data: updateDiscountDto.product_ids.map((pId) => ({
              product_id: pId,
              discount_id: discount.id,
            })),
          });
        }
      }

      // Handle category list updates
      if (updateDiscountDto.category_ids !== undefined) {
        await tx.categoryDiscount.deleteMany({ where: { discount_id: discount.id } });
        if (finalScope === 'CATEGORY' && updateDiscountDto.category_ids.length > 0) {
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

  async remove(id: string) {
    const discount = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // Clear relations first
      await tx.productDiscount.deleteMany({ where: { discount_id: discount.id } });
      await tx.categoryDiscount.deleteMany({ where: { discount_id: discount.id } });

      return tx.discount.delete({
        where: { id: discount.id },
      });
    });
  }

  async validateCoupon(code: string, items?: CouponItemDto[]) {
    const discount = await this.prisma.discount.findUnique({
      where: { coup_code: code },
      include: {
        product_discounts: true,
        category_discounts: true,
      },
    });

    if (!discount) {
      return { valid: false, message: `Coupon "${code}" does not exist` };
    }

    if (!discount.is_active) {
      return { valid: false, message: `Coupon "${code}" is inactive` };
    }

    const now = new Date();
    if (discount.valid_from && now < new Date(discount.valid_from)) {
      return { valid: false, message: `Coupon "${code}" is not valid yet` };
    }
    if (discount.valid_to && now > new Date(discount.valid_to)) {
      return { valid: false, message: `Coupon "${code}" has expired` };
    }

    // Evaluate items criteria
    if (!items || items.length === 0) {
      if (discount.min_qty || discount.min_val) {
        return { valid: false, message: `Coupon requires items for validation` };
      }
      return {
        valid: true,
        discount,
        discount_amount: Number(discount.type === 'FIXED' ? discount.value : 0),
      };
    }

    // Filter eligible items based on scope
    let eligibleItems = items;
    if (discount.scope === 'PRODUCT') {
      const allowedProductIds = discount.product_discounts.map((pd) => pd.product_id);
      eligibleItems = items.filter((item) => allowedProductIds.includes(item.product_id));
    } else if (discount.scope === 'CATEGORY') {
      const allowedCategoryIds = discount.category_discounts.map((cd) => cd.category_id);
      eligibleItems = items.filter((item) => allowedCategoryIds.includes(item.category_id));
    }

    if (eligibleItems.length === 0) {
      return { valid: false, message: `No eligible items in cart for coupon scope "${discount.scope}"` };
    }

    const totalQty = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
    const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    if (discount.min_qty && totalQty < discount.min_qty) {
      return {
        valid: false,
        message: `Minimum quantity of ${discount.min_qty} eligible items required. Current: ${totalQty}`,
      };
    }

    if (discount.min_val && eligibleSubtotal < Number(discount.min_val)) {
      return {
        valid: false,
        message: `Minimum order value of $${discount.min_val} eligible items required. Current: $${eligibleSubtotal}`,
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = eligibleSubtotal * (Number(discount.value) / 100);
    } else if (discount.type === 'FIXED') {
      discountAmount = Math.min(Number(discount.value), eligibleSubtotal);
    }

    return {
      valid: true,
      discount,
      discount_amount: discountAmount,
    };
  }
}

