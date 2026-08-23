import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CancelBillCommand } from './cancel-bill.command';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BillStatus,
  InventoryTransactionType,
  CustomerTransactionType,
  LoyaltyTransactionType,
} from '@prisma/client';

@CommandHandler(CancelBillCommand)
export class CancelBillHandler implements ICommandHandler<CancelBillCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CancelBillCommand) {
    const { id, updateBillDto } = command;

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
      }, { timeout: 30000, maxWait: 10000 });
    }

    // Default updates
    return this.prisma.bill.update({
      where: { id: bill.id },
      data: { notes: updateBillDto.notes },
    });
  }
}
