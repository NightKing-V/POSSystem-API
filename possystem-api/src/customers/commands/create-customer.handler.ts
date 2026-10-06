import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateCustomerCommand } from './create-customer.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler implements ICommandHandler<CreateCustomerCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateCustomerCommand) {
    const { createCustomerDto } = command;

    const org = await this.prisma.org.findUnique({
      where: { id: createCustomerDto.org_id },
    });
    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${createCustomerDto.org_id}" not found`,
      );
    }

    const existing = await this.prisma.customer.findFirst({
      where: {
        org_id: createCustomerDto.org_id,
        phone: createCustomerDto.phone,
        deleted_at: null,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Customer with phone "${createCustomerDto.phone}" already exists in this organization`,
      );
    }

    return this.prisma.customer.create({
      data: {
        org_id: createCustomerDto.org_id,
        full_name: createCustomerDto.full_name,
        phone: createCustomerDto.phone,
        email: createCustomerDto.email || null,
        address: createCustomerDto.address || null,
        notes: createCustomerDto.notes || null,
        customer_type: createCustomerDto.customer_type || null,
        sms_opt_out: createCustomerDto.sms_opt_out ?? false,
        is_loyalty_member: createCustomerDto.is_loyalty_member ?? false,
      },
    });
  }
}
