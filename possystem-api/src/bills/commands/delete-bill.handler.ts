import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteBillCommand } from './delete-bill.command';
import { PrismaService } from '../../prisma/prisma.service';
import { BillStatus } from '@prisma/client';

@CommandHandler(DeleteBillCommand)
export class DeleteBillHandler implements ICommandHandler<DeleteBillCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteBillCommand) {
    const { id, force } = command;

    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) {
      throw new NotFoundException(`Bill with ID "${id}" not found`);
    }

    if (!force && bill.status !== BillStatus.CANCELLED) {
      throw new BadRequestException(
        'Only cancelled bills can be deleted from logs',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.billItem.deleteMany({ where: { bill_id: bill.id } });
      await tx.billPayment.deleteMany({ where: { bill_id: bill.id } });
      await tx.customerCreditTransaction.deleteMany({
        where: { bill_id: bill.id },
      });
      await tx.customerLoyaltyTransaction.deleteMany({
        where: { bill_id: bill.id },
      });

      return tx.bill.delete({
        where: { id: bill.id },
      });
    });
  }
}
