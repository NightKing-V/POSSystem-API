import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBillCommand } from './create-bill.command';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BillStatus,
  PaymentMethod,
  InventoryTransactionType,
  CustomerTransactionType,
  LoyaltyTransactionType,
} from '@prisma/client';

@CommandHandler(CreateBillCommand)
export class CreateBillHandler implements ICommandHandler<CreateBillCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateBillCommand) {
    const { createBillDto } = command;
    const {
      org_id,
      location_id,
      customer_id,
      cashier_id,
      items,
      payments,
      coupon_code,
      taxes,
      notes,
    } = createBillDto;

    // 1. Verify basic entities exist
    const org = await this.prisma.org.findUnique({ where: { id: org_id } });
    if (!org) throw new NotFoundException(`Organization with ID "${org_id}" not found`);

    const location = await this.prisma.inventoryLocation.findUnique({ where: { id: location_id } });
    if (!location) throw new NotFoundException(`Location with ID "${location_id}" not found`);

    const cashier = await this.prisma.user.findUnique({ where: { id: cashier_id } });
    if (!cashier) throw new NotFoundException(`Cashier with ID "${cashier_id}" not found`);

    let customer: any = null;
    if (customer_id) {
      customer = await this.prisma.customer.findFirst({
        where: { id: customer_id, deleted_at: null },
      });
      if (!customer) throw new NotFoundException(`Customer with ID "${customer_id}" not found`);
    }

    return this.prisma.$transaction(
      async (tx) => {
      let subtotal = 0;
      let discount_total = 0;
      const billItemsToCreate: any[] = [];
      const stockDeductionsToPerform: any[] = [];

      // 2. Process items, resolve prices, calculate item-level discounts
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
          include: { prices: true, category: true },
        });
        if (!product || product.org_id !== org_id) {
          throw new NotFoundException(
            `Product with ID "${item.product_id}" not found in organization "${org_id}"`,
          );
        }

        // Resolve Price
        let priceRecord: any = null;
        if (item.price_id) {
          priceRecord = product.prices.find((p) => p.id === item.price_id);
          if (!priceRecord)
            throw new BadRequestException(`Price with ID "${item.price_id}" not found on product`);
        } else {
          priceRecord = product.prices.find((p) => p.isdefault === true);
          if (!priceRecord)
            throw new BadRequestException(`No default price found for product "${product.name}"`);
        }

        const unitPrice = Number(priceRecord.price);
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;

        // Calculate item-level discounts (Product and Category scopes)
        let itemDiscountAmount = 0;

        const productDiscounts = await tx.productDiscount.findMany({
          where: { product_id: product.id },
          include: { discount: true },
        });

        const categoryDiscounts = await tx.categoryDiscount.findMany({
          where: { category_id: product.subcategoryid },
          include: { discount: true },
        });

        const activeDiscounts = [...productDiscounts, ...categoryDiscounts]
          .map((d) => d.discount)
          .filter((d) => {
            const now = new Date();
            return (
              d.org_id === org_id &&
              d.is_active &&
              (!d.valid_from || now >= new Date(d.valid_from)) &&
              (!d.valid_to || now <= new Date(d.valid_to))
            );
          });

        if (activeDiscounts.length > 0) {
          const stackable = activeDiscounts.filter((d) => d.is_stackable);
          const nonStackable = activeDiscounts.filter((d) => !d.is_stackable);

          let stackableSum = 0;
          for (const d of stackable) {
            const val =
              d.type === 'PERCENTAGE' ? itemSubtotal * (Number(d.value) / 100) : Number(d.value);
            stackableSum += val;
          }

          let maxNonStackable = 0;
          for (const d of nonStackable) {
            const val =
              d.type === 'PERCENTAGE' ? itemSubtotal * (Number(d.value) / 100) : Number(d.value);
            if (val > maxNonStackable) maxNonStackable = val;
          }

          itemDiscountAmount = Math.max(stackableSum, maxNonStackable);
          itemDiscountAmount = Math.min(itemDiscountAmount, itemSubtotal);
        }

        discount_total += itemDiscountAmount;
        const lineTotal = itemSubtotal - itemDiscountAmount;

        stockDeductionsToPerform.push({
          product_id: product.id,
          batch_id: item.batch_id,
          quantity: item.quantity,
        });

        billItemsToCreate.push({
          product_id: product.id,
          batch_id: item.batch_id || null,
          price_id: priceRecord.id,
          quantity: item.quantity,
          unit_price: unitPrice,
          discount_amount: itemDiscountAmount,
          line_total: lineTotal,
          notes: item.notes || null,
        });
      }

      // 3. Apply order-level coupon discount if provided
      let orderCouponDiscount = 0;
      if (coupon_code) {
        const coupon = await tx.discount.findUnique({
          where: {
            org_id_coup_code: {
              org_id,
              coup_code: coupon_code,
            },
          },
        });

        if (!coupon || !coupon.is_active) {
          throw new BadRequestException(`Coupon "${coupon_code}" is invalid or inactive`);
        }

        const now = new Date();
        if (coupon.valid_from && now < new Date(coupon.valid_from)) {
          throw new BadRequestException(`Coupon "${coupon_code}" is not yet active`);
        }
        if (coupon.valid_to && now > new Date(coupon.valid_to)) {
          throw new BadRequestException(`Coupon "${coupon_code}" has expired`);
        }

        const eligibleSubtotal = subtotal - discount_total;
        if (coupon.min_val && eligibleSubtotal < Number(coupon.min_val)) {
          throw new BadRequestException(`Coupon requires minimum order value of $${coupon.min_val}`);
        }

        const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
        if (coupon.min_qty && totalItemsCount < coupon.min_qty) {
          throw new BadRequestException(`Coupon requires minimum quantity of ${coupon.min_qty}`);
        }

        if (coupon.type === 'PERCENTAGE') {
          orderCouponDiscount = eligibleSubtotal * (Number(coupon.value) / 100);
        } else {
          orderCouponDiscount = Math.min(Number(coupon.value), eligibleSubtotal);
        }
        discount_total += orderCouponDiscount;
      }

      // 4. Calculate customizable Taxes
      let tax_total = 0;
      const appliedTaxesList: string[] = [];
      const subtotalAfterDiscounts = Math.max(0, subtotal - discount_total);

      if (taxes && taxes.length > 0) {
        for (const tax of taxes) {
          if (tax.is_active !== false) {
            const taxAmt = subtotalAfterDiscounts * (tax.rate / 100);
            tax_total += taxAmt;
            appliedTaxesList.push(`${tax.name} (${tax.rate}%)`);
          }
        }
      }

      const grand_total = subtotalAfterDiscounts + tax_total;

      // 5. Deduct inventory stock
      const finalBillItems: any[] = [];
      for (const deduction of stockDeductionsToPerform) {
        if (deduction.batch_id) {
          const stock = await tx.inventoryStock.findUnique({
            where: {
              batch_id_location_id: {
                batch_id: deduction.batch_id,
                location_id: location_id,
              },
            },
          });

          if (!stock || stock.quantity_on_hand < deduction.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product in batch "${deduction.batch_id}" at location "${location.name}"`,
            );
          }

          await tx.inventoryStock.update({
            where: { id: stock.id },
            data: { quantity_on_hand: { decrement: deduction.quantity } },
          });

          await tx.inventoryTransaction.create({
            data: {
              batch_id: deduction.batch_id,
              location_id: location_id,
              transaction_type: InventoryTransactionType.SALE,
              quantity_change: -deduction.quantity,
              notes: `POS Bill sale`,
              recorded_by: cashier_id,
            },
          });

          const mapped = billItemsToCreate.find(
            (b) => b.product_id === deduction.product_id && b.batch_id === deduction.batch_id,
          );
          if (mapped) finalBillItems.push(mapped);
        } else {
          const availableStocks = await tx.inventoryStock.findMany({
            where: {
              location_id: location_id,
              batch: { product_id: deduction.product_id },
              quantity_on_hand: { gt: 0 },
            },
            include: { batch: true },
            orderBy: { batch: { received_at: 'asc' } },
          });

          const totalAvailable = availableStocks.reduce((sum, s) => sum + s.quantity_on_hand, 0);
          if (totalAvailable < deduction.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product "${deduction.product_id}" at location "${location.name}". Available: ${totalAvailable}, Requested: ${deduction.quantity}`,
            );
          }

          let remainingToDeduct = deduction.quantity;
          const matchingTemplate = billItemsToCreate.find(
            (b) => b.product_id === deduction.product_id && b.batch_id === null,
          );

          for (const stock of availableStocks) {
            if (remainingToDeduct <= 0) break;

            const deductFromThisBatch = Math.min(stock.quantity_on_hand, remainingToDeduct);

            await tx.inventoryStock.update({
              where: { id: stock.id },
              data: { quantity_on_hand: { decrement: deductFromThisBatch } },
            });

            await tx.inventoryTransaction.create({
              data: {
                batch_id: stock.batch_id,
                location_id: location_id,
                transaction_type: InventoryTransactionType.SALE,
                quantity_change: -deductFromThisBatch,
                notes: `POS Bill sale (FIFO Auto-allocated)`,
                recorded_by: cashier_id,
              },
            });

            if (matchingTemplate) {
              finalBillItems.push({
                ...matchingTemplate,
                batch_id: stock.batch_id,
                quantity: deductFromThisBatch,
                line_total:
                  (matchingTemplate.unit_price -
                    matchingTemplate.discount_amount / matchingTemplate.quantity) *
                  deductFromThisBatch,
              });
            }

            remainingToDeduct -= deductFromThisBatch;
          }
        }
      }

      // 6. Process Payments & Customer Credit Accounts
      let totalPaid = 0;
      const paymentRecordsToCreate: any[] = [];

      for (const p of payments) {
        totalPaid += p.amount;

        if (p.payment_method === PaymentMethod.CREDIT_ACCOUNT) {
          if (!customer) {
            throw new BadRequestException('A customer is required to charge to a credit account');
          }

          const creditAccount = await tx.customerCreditAccount.findUnique({
            where: { customer_id: customer.id },
          });

          if (!creditAccount || creditAccount.status !== 'ACTIVE') {
            throw new BadRequestException('Customer credit account is suspended or does not exist');
          }

          if (creditAccount.credit_limit) {
            const potentialBalance = Number(creditAccount.current_balance) + p.amount;
            if (potentialBalance > Number(creditAccount.credit_limit)) {
              throw new BadRequestException(
                `Credit limit exceeded. Limit: $${creditAccount.credit_limit}, Potential Balance: $${potentialBalance}`,
              );
            }
          }

          const updatedAcct = await tx.customerCreditAccount.update({
            where: { id: creditAccount.id },
            data: { current_balance: { increment: p.amount } },
          });

          paymentRecordsToCreate.push({
            payment_method: p.payment_method,
            amount: p.amount,
            reference_no: p.reference_no || null,
            recorded_by: cashier_id,
            creditTx: {
              customer_id: customer.id,
              org_id: org_id,
              recorded_by: cashier_id,
              transaction_type: CustomerTransactionType.CHARGED,
              amount: p.amount,
              balance_after: updatedAcct.current_balance,
              notes: 'POS Bill checkout charges',
            },
          });
        } else if (p.payment_method === PaymentMethod.LOYALTY_POINTS) {
          if (!customer || !customer.is_loyalty_member) {
            throw new BadRequestException(
              'A loyalty member customer is required to redeem loyalty points',
            );
          }

          const loyaltyConfig = await tx.loyaltyProgramConfig.findUnique({
            where: { org_id: org_id },
          });

          if (!loyaltyConfig || !loyaltyConfig.is_active) {
            throw new BadRequestException(
              'Loyalty points program is inactive for this organization',
            );
          }

          const pointValue = Number(loyaltyConfig.rupee_value_per_point);
          if (pointValue <= 0) {
            throw new BadRequestException('Invalid point value configuration in loyalty program');
          }

          const pointsToRedeem = Math.ceil(p.amount / pointValue);
          if (customer.loyalty_points < pointsToRedeem) {
            throw new BadRequestException(
              `Insufficient loyalty points. Balance: ${customer.loyalty_points}, Needed: ${pointsToRedeem}`,
            );
          }

          const updatedCustomer = await tx.customer.update({
            where: { id: customer.id },
            data: { loyalty_points: { decrement: pointsToRedeem } },
          });

          paymentRecordsToCreate.push({
            payment_method: p.payment_method,
            amount: p.amount,
            reference_no: p.reference_no || null,
            recorded_by: cashier_id,
            loyaltyTx: {
              customer_id: customer.id,
              org_id: org_id,
              transaction_type: LoyaltyTransactionType.REDEEMED,
              points: -pointsToRedeem,
              points_balance_after: updatedCustomer.loyalty_points,
              notes: `Redeemed ${pointsToRedeem} points for payment of $${p.amount}`,
            },
          });
        } else {
          paymentRecordsToCreate.push({
            payment_method: p.payment_method,
            amount: p.amount,
            reference_no: p.reference_no || null,
            recorded_by: cashier_id,
          });
        }
      }

      if (totalPaid < grand_total) {
        throw new BadRequestException(
          `Insufficient payments. Bill total is $${grand_total}, but received payments of $${totalPaid}`,
        );
      }

      const change_given = totalPaid > grand_total ? totalPaid - grand_total : 0;

      // 7. Reward loyalty points
      let loyaltyEarnedTx: any = null;
      if (customer && customer.is_loyalty_member) {
        const loyaltyConfig = await tx.loyaltyProgramConfig.findUnique({
          where: { org_id: org_id },
        });

        if (loyaltyConfig && loyaltyConfig.is_active) {
          const pointsRate = Number(loyaltyConfig.points_per_rupee);
          const pointsEarned = Math.floor(grand_total * pointsRate);

          if (pointsEarned > 0) {
            const updatedCustomer = await tx.customer.update({
              where: { id: customer.id },
              data: { loyalty_points: { increment: pointsEarned } },
            });

            loyaltyEarnedTx = {
              customer_id: customer.id,
              org_id: org_id,
              transaction_type: LoyaltyTransactionType.EARNED,
              points: pointsEarned,
              points_balance_after: updatedCustomer.loyalty_points,
              notes: `Earned on purchase of $${grand_total}`,
            };
          }
        }
      }

      // 8. Update Customer metrics
      if (customer) {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            total_visits: { increment: 1 },
            total_spent: { increment: grand_total },
            first_visit_at: customer.first_visit_at ? undefined : new Date(),
            last_visit_at: new Date(),
          },
        });
      }

      // 9. Generate unique bill number
      const billNumber = await this.generateUniqueBillNumber(tx, org_id);

      const taxNotes =
        appliedTaxesList.length > 0 ? `Applied Taxes: ${appliedTaxesList.join(', ')}.` : '';
      const finalNotes = notes ? `${notes} | ${taxNotes}` : taxNotes;

      // 10. Create the Bill
      const bill = await tx.bill.create({
        data: {
          org_id,
          location_id,
          customer_id: customer_id || null,
          cashier_id,
          bill_number: billNumber,
          status: BillStatus.COMPLETED,
          subtotal,
          discount_total,
          tax_total,
          grand_total,
          amount_paid: totalPaid,
          change_given,
          notes: finalNotes || null,
          items: {
            create: finalBillItems.map((bi) => ({
              product_id: bi.product_id,
              batch_id: bi.batch_id,
              price_id: bi.price_id,
              quantity: bi.quantity,
              unit_price: bi.unit_price,
              discount_amount: bi.discount_amount,
              line_total: bi.line_total,
              notes: bi.notes,
            })),
          },
          payments: {
            create: paymentRecordsToCreate.map((pr) => ({
              payment_method: pr.payment_method,
              amount: pr.amount,
              reference_no: pr.reference_no,
              recorded_by: pr.recorded_by,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          payments: true,
        },
      });

      for (const pr of paymentRecordsToCreate) {
        if (pr.creditTx) {
          await tx.customerCreditTransaction.create({
            data: { ...pr.creditTx, bill_id: bill.id },
          });
        }
        if (pr.loyaltyTx) {
          await tx.customerLoyaltyTransaction.create({
            data: { ...pr.loyaltyTx, bill_id: bill.id },
          });
        }
      }

      if (loyaltyEarnedTx) {
        await tx.customerLoyaltyTransaction.create({
          data: { ...loyaltyEarnedTx, bill_id: bill.id },
        });
      }

      return bill;
    }, { timeout: 30000, maxWait: 10000 });
  }

  private async generateUniqueBillNumber(tx: any, orgId: string): Promise<string> {
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let isUnique = false;
    let billNo = '';

    while (!isUnique) {
      let rand = '';
      for (let i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      billNo = `BILL-${dateStr}-${rand}`;

      const existing = await tx.bill.findUnique({
        where: {
          org_id_bill_number: {
            org_id: orgId,
            bill_number: billNo,
          },
        },
      });
      if (!existing) {
        isUnique = true;
      }
    }
    return billNo;
  }
}
