import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteCustomerCommand } from './delete-customer.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteCustomerCommand) {
    const { id, force } = command;

    const customer = await this.prisma.customer.findFirst({
      where: { id, ...(force ? {} : { deleted_at: null }) },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    if (force) {
      return this.prisma.$transaction(async (tx) => {
        // Delete all customer dependencies
        await tx.customerLoyaltyTransaction.deleteMany({ where: { customer_id: id } });
        await tx.customerCreditTransaction.deleteMany({ where: { customer_id: id } });
        await tx.customerCreditAccount.deleteMany({ where: { customer_id: id } });

        return tx.customer.delete({
          where: { id },
        });
      });
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }
}
