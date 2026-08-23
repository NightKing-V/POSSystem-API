import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteCustomerCommand } from './delete-customer.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteCustomerCommand) {
    const { id } = command;

    const customer = await this.prisma.customer.findFirst({
      where: { id, deleted_at: null },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }
}
