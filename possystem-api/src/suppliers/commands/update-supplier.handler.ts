import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UpdateSupplierCommand } from './update-supplier.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateSupplierCommand)
export class UpdateSupplierHandler implements ICommandHandler<UpdateSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSupplierCommand) {
    const { id, updateSupplierDto } = command;

    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: updateSupplierDto.name,
        contact_person: updateSupplierDto.contact_person,
        phone: updateSupplierDto.phone,
        email: updateSupplierDto.email,
        address: updateSupplierDto.address,
        business_reg_no: updateSupplierDto.business_reg_no,
        description: updateSupplierDto.description,
      },
    });
  }
}
