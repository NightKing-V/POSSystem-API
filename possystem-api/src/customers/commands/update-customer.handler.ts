import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateCustomerCommand } from './update-customer.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateCustomerCommand) {
    const { id, updateCustomerDto } = command;

    const customer = await this.prisma.customer.findFirst({
      where: { id, deleted_at: null },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    if (updateCustomerDto.phone) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          phone: updateCustomerDto.phone,
          id: { not: id },
          deleted_at: null,
        },
      });
      if (existing) {
        throw new ConflictException(
          `Customer with phone "${updateCustomerDto.phone}" already exists`,
        );
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }
}
