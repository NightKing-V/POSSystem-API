import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ValidateCouponQuery } from './validate-coupon.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(ValidateCouponQuery)
export class ValidateCouponHandler implements IQueryHandler<ValidateCouponQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ValidateCouponQuery) {
    const { code, items } = query;

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

    if (!items || items.length === 0) {
      if (discount.min_qty || discount.min_val) {
        return {
          valid: false,
          message: `Coupon requires items for validation`,
        };
      }
      return {
        valid: true,
        discount,
        discount_amount: Number(discount.type === 'FIXED' ? discount.value : 0),
      };
    }

    let eligibleItems = items;
    if (discount.scope === 'PRODUCT') {
      const allowedProductIds = discount.product_discounts.map(
        (pd) => pd.product_id,
      );
      eligibleItems = items.filter((item) =>
        allowedProductIds.includes(item.product_id),
      );
    } else if (discount.scope === 'CATEGORY') {
      const allowedCategoryIds = discount.category_discounts.map(
        (cd) => cd.category_id,
      );
      eligibleItems = items.filter((item) =>
        allowedCategoryIds.includes(item.category_id),
      );
    }

    if (eligibleItems.length === 0) {
      return {
        valid: false,
        message: `No eligible items in cart for coupon scope "${discount.scope}"`,
      };
    }

    const totalQty = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
    const eligibleSubtotal = eligibleItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );

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
