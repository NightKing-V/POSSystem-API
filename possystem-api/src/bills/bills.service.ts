import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBillDto, BillItemDto, BillPaymentDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BillStatus, PaymentMethod, InventoryTransactionType, CustomerTransactionType, LoyaltyTransactionType } from '@prisma/client';

@Injectable()
export class BillsService {
  constructor(private prisma: PrismaService) {}

  async create(createBillDto: CreateBillDto) {
    const { org_id, location_id, customer_id, cashier_id, items, payments, coupon_code, taxes, notes } = createBillDto;

    // 1. Verify basic entities exist
    const org = await this.prisma.org.findUnique({ where: { id: org_id } });
    if (!org) throw new NotFoundException(`Organization with ID "${org_id}" not found`);

    const location = await this.prisma.inventoryLocation.findUnique({ where: { id: location_id } });
    if (!location) throw new NotFoundException(`Location with ID "${location_id}" not found`);

    const cashier = await this.prisma.user.findUnique({ where: { id: cashier_id } });
    if (!cashier) throw new NotFoundException(`Cashier with ID "${cashier_id}" not found`);

    let customer: any = null;
    if (customer_id) {
      customer = await this.prisma.customer.findFirst({ where: { id: customer_id, deleted_at: null } });
      if (!customer) throw new NotFoundException(`Customer with ID "${customer_id}" not found`);
    }

    // Run the checkout process inside a database transaction to ensure safety
    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let discount_total = 0;
      const billItemsToCreate: any[] = [];
      const stockDeductionsToPerform: any[] = []; // { stockId, quantity, batchId, productId }

      // 2. Process items, resolve prices, calculate item-level discounts
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
          include: { prices: true, category: true },
        });
        if (!product) throw new NotFoundException(`Product with ID "${item.product_id}" not found`);

        // Resolve Price
        let priceRecord: any = null;
        if (item.price_id) {
          priceRecord = product.prices.find((p) => p.id === item.price_id);
          if (!priceRecord) throw new BadRequestException(`Price with ID "${item.price_id}" not found on product`);
        } else {
          priceRecord = product.prices.find((p) => p.isdefault === true);
          if (!priceRecord) throw new BadRequestException(`No default price found for product "${product.name}"`);
        }

        const unitPrice = Number(priceRecord.price);
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;

        // Calculate item-level discounts (Product and Category scopes)
        let itemDiscountAmount = 0;

        // Fetch active product discounts
        const productDiscounts = await tx.productDiscount.findMany({
          where: { product_id: product.id },
          include: { discount: true },
        });

        // Fetch active category discounts
        const categoryDiscounts = await tx.categoryDiscount.findMany({
          where: { category_id: product.subcategoryid },
          include: { discount: true },
        });

        const activeDiscounts = [...productDiscounts, ...categoryDiscounts]
          .map((d) => d.discount)
          .filter((d) => {
            const now = new Date();
            return (
              d.is_active &&
              (!d.valid_from || now >= new Date(d.valid_from)) &&
              (!d.valid_to || now <= new Date(d.valid_to))
            );
          });

        if (activeDiscounts.length > 0) {
          // If stackable, sum them. Otherwise pick the highest discount.
          const stackable = activeDiscounts.filter((d) => d.is_stackable);
          const nonStackable = activeDiscounts.filter((d) => !d.is_stackable);

          let stackableSum = 0;
          for (const d of stackable) {
            const val = d.type === 'PERCENTAGE' ? itemSubtotal * (Number(d.value) / 100) : Number(d.value);
            stackableSum += val;
          }

          let maxNonStackable = 0;
          for (const d of nonStackable) {
            const val = d.type === 'PERCENTAGE' ? itemSubtotal * (Number(d.value) / 100) : Number(d.value);
            if (val > maxNonStackable) maxNonStackable = val;
          }

          itemDiscountAmount = Math.max(stackableSum, maxNonStackable);
          itemDiscountAmount = Math.min(itemDiscountAmount, itemSubtotal); // Cannot exceed price
        }

        discount_total += itemDiscountAmount;
        const lineTotal = itemSubtotal - itemDiscountAmount;

        // Track stock deduction details (handled in separate step below)
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
          where: { coup_code: coupon_code },
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

        // Validate thresholds
        const eligibleSubtotal = subtotal - discount_total;
        if (coupon.min_val && eligibleSubtotal < Number(coupon.min_val)) {
          throw new BadRequestException(`Coupon requires minimum order value of $${coupon.min_val}`);
        }

        const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
        if (coupon.min_qty && totalItemsCount < coupon.min_qty) {
          throw new BadRequestException(`Coupon requires minimum quantity of ${coupon.min_qty}`);
        }

        // Calculate coupon discount
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
          // Deduct from a specific batch
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

          // Update stock
          await tx.inventoryStock.update({
            where: { id: stock.id },
            data: { quantity_on_hand: { decrement: deduction.quantity } },
          });

          // Log transaction
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

          // Map items to includeResolved batch_id
          const mapped = billItemsToCreate.find(
            (b) => b.product_id === deduction.product_id && b.batch_id === deduction.batch_id,
          );
          if (mapped) finalBillItems.push(mapped);
        } else {
          // Dynamic FIFO batch selection fallback
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

            // Update Stock
            await tx.inventoryStock.update({
              where: { id: stock.id },
              data: { quantity_on_hand: { decrement: deductFromThisBatch } },
            });

            // Log Transaction
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

            // Create separate BillItem lines for each allocated batch
            if (matchingTemplate) {
              finalBillItems.push({
                ...matchingTemplate,
                batch_id: stock.batch_id,
                quantity: deductFromThisBatch,
                line_total: (matchingTemplate.unit_price - (matchingTemplate.discount_amount / matchingTemplate.quantity)) * deductFromThisBatch,
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

          // Update customer credit account balance
          const updatedAcct = await tx.customerCreditAccount.update({
            where: { id: creditAccount.id },
            data: { current_balance: { increment: p.amount } },
          });

          // Log credit transaction (we will link to the created bill ID later or keep as is)
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
            throw new BadRequestException('A loyalty member customer is required to redeem loyalty points');
          }

          const loyaltyConfig = await tx.loyaltyProgramConfig.findUnique({
            where: { org_id: org_id },
          });

          if (!loyaltyConfig || !loyaltyConfig.is_active) {
            throw new BadRequestException('Loyalty points program is inactive for this organization');
          }

          // Convert points payment amount to actual points needed
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

          // Deduct points
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
          // Standard Payment
          paymentRecordsToCreate.push({
            payment_method: p.payment_method,
            amount: p.amount,
            reference_no: p.reference_no || null,
            recorded_by: cashier_id,
          });
        }
      }

      // Check payment coverage
      if (totalPaid < grand_total) {
        throw new BadRequestException(
          `Insufficient payments. Bill total is $${grand_total}, but received payments of $${totalPaid}`,
        );
      }

      const change_given = totalPaid > grand_total ? totalPaid - grand_total : 0;

      // 7. Calculate and reward loyalty points for earning (if customer is loyalty member)
      let loyaltyEarnedTx: any = null;
      if (customer && customer.is_loyalty_member) {
        const loyaltyConfig = await tx.loyaltyProgramConfig.findUnique({
          where: { org_id: org_id },
        });

        if (loyaltyConfig && loyaltyConfig.is_active) {
          const pointsRate = Number(loyaltyConfig.points_per_rupee);
          // Reward points based on grand_total (owner rule configurable)
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

      // 8. Update Customer metrics (visits and total spent)
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

      // 9. Generate reliable unique bill number
      const billNumber = await this.generateUniqueBillNumber(tx);

      // Serialize tax info to notes
      const taxNotes = appliedTaxesList.length > 0 ? `Applied Taxes: ${appliedTaxesList.join(', ')}.` : '';
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

      // Write credit and loyalty transactions linking the bill ID
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
    });
  }

  async findAll(orgId?: string, locationId?: string, customerId?: string) {
    return this.prisma.bill.findMany({
      where: {
        ...(orgId ? { org_id: orgId } : {}),
        ...(locationId ? { location_id: locationId } : {}),
        ...(customerId ? { customer_id: customerId } : {}),
      },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        cashier: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        cashier: true,
        credit_txs: true,
        loyalty_txs: true,
      },
    });

    if (!bill) {
      throw new NotFoundException(`Bill with ID "${id}" not found`);
    }

    return bill;
  }

  async update(id: string, updateBillDto: UpdateBillDto) {
    const bill = await this.findOne(id);

    // If cancelling or refunding, perform reversals
    if (
      updateBillDto.status &&
      updateBillDto.status !== bill.status &&
      (updateBillDto.status === BillStatus.CANCELLED || updateBillDto.status === BillStatus.REFUNDED)
    ) {
      if (bill.status === BillStatus.CANCELLED || bill.status === BillStatus.REFUNDED) {
        throw new BadRequestException('Bill is already cancelled or refunded');
      }

      return this.prisma.$transaction(async (tx) => {
        // 1. Revert Inventory Stock
        for (const item of bill.items) {
          if (item.batch_id) {
            await tx.inventoryStock.upsert({
              where: {
                batch_id_location_id: {
                  batch_id: item.batch_id,
                  location_id: bill.location_id,
                },
              },
              create: {
                batch_id: item.batch_id,
                location_id: bill.location_id,
                quantity_on_hand: item.quantity,
              },
              update: {
                quantity_on_hand: { increment: item.quantity },
              },
            });

            await tx.inventoryTransaction.create({
              data: {
                batch_id: item.batch_id,
                location_id: bill.location_id,
                transaction_type: InventoryTransactionType.RECEIVED,
                quantity_change: item.quantity,
                notes: `Reverted from bill cancel/refund (${bill.bill_number})`,
                recorded_by: bill.cashier_id,
              },
            });
          }
        }

        // 2. Revert Credit Charged
        const creditTransactions = await tx.customerCreditTransaction.findMany({
          where: { bill_id: bill.id, transaction_type: CustomerTransactionType.CHARGED },
        });

        for (const ct of creditTransactions) {
          const creditAccount = await tx.customerCreditAccount.findUnique({
            where: { customer_id: ct.customer_id },
          });

          if (creditAccount) {
            const updatedAccount = await tx.customerCreditAccount.update({
              where: { id: creditAccount.id },
              data: { current_balance: { decrement: ct.amount } },
            });

            await tx.customerCreditTransaction.create({
              data: {
                customer_id: ct.customer_id,
                org_id: ct.org_id,
                bill_id: bill.id,
                recorded_by: bill.cashier_id,
                transaction_type: CustomerTransactionType.REPAID,
                amount: ct.amount,
                balance_after: updatedAccount.current_balance,
                notes: `Reverted charges from bill refund/cancel (${bill.bill_number})`,
              },
            });
          }
        }

        // 3. Revert Loyalty Points Earned and Redeemed
        const loyaltyTransactions = await tx.customerLoyaltyTransaction.findMany({
          where: { bill_id: bill.id },
        });

        for (const lt of loyaltyTransactions) {
          if (lt.transaction_type === LoyaltyTransactionType.EARNED) {
            // Deduct the earned points
            const updatedCustomer = await tx.customer.update({
              where: { id: lt.customer_id },
              data: { loyalty_points: { decrement: lt.points } },
            });

            await tx.customerLoyaltyTransaction.create({
              data: {
                customer_id: lt.customer_id,
                org_id: lt.org_id,
                bill_id: bill.id,
                transaction_type: LoyaltyTransactionType.EXPIRED,
                points: -lt.points,
                points_balance_after: updatedCustomer.loyalty_points,
                notes: `Reversal of earned points from bill cancel/refund (${bill.bill_number})`,
              },
            });
          } else if (lt.transaction_type === LoyaltyTransactionType.REDEEMED) {
            // Restore redeemed points
            const absolutePoints = Math.abs(lt.points);
            const updatedCustomer = await tx.customer.update({
              where: { id: lt.customer_id },
              data: { loyalty_points: { increment: absolutePoints } },
            });

            await tx.customerLoyaltyTransaction.create({
              data: {
                customer_id: lt.customer_id,
                org_id: lt.org_id,
                bill_id: bill.id,
                transaction_type: LoyaltyTransactionType.EARNED,
                points: absolutePoints,
                points_balance_after: updatedCustomer.loyalty_points,
                notes: `Restored redeemed points from bill cancel/refund (${bill.bill_number})`,
              },
            });
          }
        }

        // 4. Revert Customer total spent and visits count metrics
        if (bill.customer_id) {
          await tx.customer.update({
            where: { id: bill.customer_id },
            data: {
              total_visits: { decrement: 1 },
              total_spent: { decrement: bill.grand_total },
            },
          });
        }

        // Update status of Bill
        return tx.bill.update({
          where: { id: bill.id },
          data: { status: updateBillDto.status },
          include: {
            items: true,
            payments: true,
          },
        });
      });
    }

    // Default updates
    return this.prisma.bill.update({
      where: { id: bill.id },
      data: { notes: updateBillDto.notes },
    });
  }

  async remove(id: string) {
    const bill = await this.findOne(id);
    if (bill.status !== BillStatus.CANCELLED) {
      throw new BadRequestException('Only cancelled bills can be deleted from logs');
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert stock, loyalty point balances, and credit account balances first before deleting
      await tx.billItem.deleteMany({ where: { bill_id: bill.id } });
      await tx.billPayment.deleteMany({ where: { bill_id: bill.id } });
      await tx.customerCreditTransaction.deleteMany({ where: { bill_id: bill.id } });
      await tx.customerLoyaltyTransaction.deleteMany({ where: { bill_id: bill.id } });

      return tx.bill.delete({
        where: { id: bill.id },
      });
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private async generateUniqueBillNumber(tx: any): Promise<string> {
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
        where: { bill_number: billNo },
      });
      if (!existing) {
        isUnique = true;
      }
    }
    return billNo;
  }
}

