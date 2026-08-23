import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CreateSupplierCommand } from './create-supplier.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateSupplierCommand)
export class CreateSupplierHandler implements ICommandHandler<CreateSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateSupplierCommand) {
    const { createSupplierDto } = command;

    const org = await this.prisma.org.findUnique({
      where: { id: createSupplierDto.org_id },
    });
    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${createSupplierDto.org_id}" not found`,
      );
    }

    return this.prisma.supplier.create({
      data: {
        org_id: createSupplierDto.org_id,
        name: createSupplierDto.name,
        contact_person: createSupplierDto.contact_person || null,
        phone: createSupplierDto.phone || null,
        email: createSupplierDto.email || null,
        address: createSupplierDto.address || null,
        business_reg_no: createSupplierDto.business_reg_no || null,
        description: createSupplierDto.description || null,
      },
    });
  }
}
