import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Verify Org exists
    const org = await this.prisma.org.findUnique({
      where: { id: createCustomerDto.org_id },
    });
    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${createCustomerDto.org_id}" not found`,
      );
    }

    // Verify phone is unique
    const existing = await this.prisma.customer.findFirst({
      where: { phone: createCustomerDto.phone, deleted_at: null },
    });
    if (existing) {
      throw new ConflictException(
        `Customer with phone "${createCustomerDto.phone}" already exists`,
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

  async findAll(orgId?: string) {
    return this.prisma.customer.findMany({
      where: {
        deleted_at: null,
        ...(orgId ? { org_id: orgId } : {}),
      },
      include: {
        credit_account: true,
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deleted_at: null },
      include: {
        credit_account: true,
        credit_txs: true,
        loyalty_txs: true,
      },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);

    if (updateCustomerDto.phone) {
      const existing = await this.prisma.customer.findFirst({
        where: { phone: updateCustomerDto.phone, id: { not: id }, deleted_at: null },
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

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.customer.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }
}

